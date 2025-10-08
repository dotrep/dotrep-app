import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import FsnHexagon from './FsnHexagon';
import { AddressBook } from './AddressBook';
import VerificationBadge from './VerificationBadge';
import { isUserVerified } from '../utils/verification';
import '../styles/verification.css';

interface WalletTabProps {
  userId: number;
  fsnName: string;
}

interface WalletAddress {
  id: number;
  userId: number;
  fsnName: string;
  blockchain: string;
  address: string;
  label: string;
  isActive: boolean;
  balance: string;
  createdAt: Date;
}

interface Transaction {
  id: number;
  walletAddressId: number;
  txHash: string;
  amount: string;
  toAddress: string;
  fromAddress: string;
  status: string;
  createdAt: Date;
  blockHeight?: number;
  blockTime?: Date;
  note?: string;
}

const WalletTab: React.FC<WalletTabProps> = ({ userId, fsnName }) => {
  const [activeSection, setActiveSection] = useState<'addresses' | 'send' | 'receive' | 'transactions' | 'contacts'>('addresses');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [recipientFsn, setRecipientFsn] = useState<string>('');
  const [selectedBlockchain, setSelectedBlockchain] = useState<string>('bitcoin');
  const [note, setNote] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string>('');
  const [sendSuccess, setSendSuccess] = useState<string>('');
  const [isAddingAddress, setIsAddingAddress] = useState<boolean>(false);
  const [newAddressLabel, setNewAddressLabel] = useState<string>('');
  const [newAddressBlockchain, setNewAddressBlockchain] = useState<string>('bitcoin');
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);

  // Handle contact selection from address book
  const handleContactSelect = (fsnName: string) => {
    setRecipientFsn(fsnName.replace('.fsn', ''));
    setActiveSection('send');
  };

  // Fetch wallet addresses
  const { data: walletAddresses = [], isLoading: isLoadingAddresses, refetch: refetchAddresses } = useQuery<WalletAddress[]>({
    queryKey: [`/api/wallet/addresses/${userId}`],
    enabled: !!userId,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useQuery<Transaction[]>({
    queryKey: [`/api/wallet/transactions/${userId}`],
    enabled: !!userId,
  });

  // No automatic .fsn appending - we handle this in the UI display instead

  // Handle initial send form submission - show confirmation dialog
  const handleSendToFsn = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!sendAmount || !recipientFsn || !selectedBlockchain) {
      setSendError('Please fill in all required fields');
      return;
    }

    setSendError('');
    setSendSuccess('');

    // Prepare transaction details for confirmation
    const transaction = {
      fromAddress: fsnName,
      toFsn: recipientFsn.endsWith('.fsn') ? recipientFsn : `${recipientFsn}.fsn`,
      amount: sendAmount,
      cryptoType: selectedBlockchain,
      memo: note || `Payment to ${recipientFsn}.fsn`,
      networkFee: getNetworkFee(selectedBlockchain),
      totalAmount: (parseFloat(sendAmount) + parseFloat(getNetworkFee(selectedBlockchain))).toFixed(8)
    };

    setPendingTransaction(transaction);
    setShowConfirmDialog(true);
  };

  // Get network fee based on blockchain
  const getNetworkFee = (blockchain: string): string => {
    const fees: {[key: string]: string} = {
      'bitcoin': '0.00001',
      'ethereum': '0.002',
      'litecoin': '0.001',
      'dogecoin': '1.0'
    };
    return fees[blockchain] || '0.001';
  };

  // Actually execute the transaction after confirmation
  const executeTransaction = async () => {
    if (!pendingTransaction) return;

    setIsSending(true);
    setShowConfirmDialog(false);

    try {
      const response = await fetch('/api/wallet/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          fromAddress: pendingTransaction.fromAddress,
          toFsn: pendingTransaction.toFsn,
          amount: pendingTransaction.amount,
          cryptoType: pendingTransaction.cryptoType,
          memo: pendingTransaction.memo,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSendSuccess(result.message || `Transaction sent: ${result.transaction?.hash}`);
        setSendAmount('');
        setRecipientFsn('');
        setNote('');
        setPendingTransaction(null);
        
        // Refetch data
        refetchTransactions();
        refetchAddresses();
      } else {
        const error = await response.json();
        setSendError(error.message || 'Failed to send transaction');
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      setSendError('Network error when sending transaction');
    } finally {
      setIsSending(false);
    }
  };

  // Cancel transaction
  const cancelTransaction = () => {
    setShowConfirmDialog(false);
    setPendingTransaction(null);
  };

  // Handle escape key to close dialog
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showConfirmDialog) {
        cancelTransaction();
      }
    };

    if (showConfirmDialog) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showConfirmDialog]);

  // Handle adding a new wallet address
  const handleAddAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!newAddressBlockchain || !newAddressLabel) {
      setSendError('Please fill in all required fields');
      return;
    }

    setIsSending(true);
    setSendError('');

    try {
      const response = await fetch('/api/wallet/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          fsnName: fsnName,
          cryptoType: newAddressBlockchain,
          label: newAddressLabel,
        }),
      });

      if (response.ok) {
        await refetchAddresses();
        setIsAddingAddress(false);
        setNewAddressLabel('');
      } else {
        const error = await response.json();
        setSendError(error.message || 'Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      setSendError('Network error when adding address');
    } finally {
      setIsSending(false);
    }
  };

  // Format blockchain name for display
  const formatBlockchainName = (name: string): string => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Format amount with blockchain symbol
  const formatAmountWithSymbol = (amount: string, blockchain: string): string => {
    const symbols: {[key: string]: string} = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'polygon': 'MATIC',
      'solana': 'SOL'
    };
    
    return `${amount} ${symbols[blockchain] || blockchain.toUpperCase()}`;
  };

  // Format transaction status with icon
  const formatStatus = (status: string): JSX.Element => {
    switch(status) {
      case 'pending':
        return <span className="status pending">⏳ Pending</span>;
      case 'completed':
        return <span className="status completed">✓ Completed</span>;
      case 'failed':
        return <span className="status failed">✗ Failed</span>;
      default:
        return <span className="status">{status}</span>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format transaction for display (truncate addresses/hashes)
  const truncateAddress = (address: string): string => {
    if (!address) return '';
    if (address.endsWith('.fsn')) return address;
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  };

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h2>FSN Wallet</h2>
        <p className="wallet-subtitle">Send and receive crypto with your FSN identity</p>
      </div>

      <div className="wallet-nav">
        <button 
          className={`wallet-nav-btn ${activeSection === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveSection('addresses')}
        >
          My Addresses
        </button>
        <button 
          className={`wallet-nav-btn ${activeSection === 'send' ? 'active' : ''}`}
          onClick={() => setActiveSection('send')}
        >
          Send
        </button>
        <button 
          className={`wallet-nav-btn ${activeSection === 'receive' ? 'active' : ''}`}
          onClick={() => setActiveSection('receive')}
        >
          Receive
        </button>
        <button 
          className={`wallet-nav-btn ${activeSection === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveSection('transactions')}
        >
          Transactions
        </button>
        <button 
          className={`wallet-nav-btn ${activeSection === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveSection('contacts')}
        >
          Address Book
        </button>
      </div>

      <div className="wallet-content">
        {activeSection === 'addresses' && (
          <div className="wallet-section">
            <div className="section-header">
              <h3>Your FSN Wallet Identity</h3>
            </div>
            
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(100, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
                gap: '16px'
              }}>
                <FsnHexagon size={60} />
                <div>
                  <h2 style={{
                    color: '#64ffff',
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: '700'
                  }}>{fsnName}</h2>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    margin: '4px 0 0 0',
                    fontSize: '16px'
                  }}>Your universal crypto address</p>
                </div>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <button 
                  onClick={() => {
                    setActiveSection('send');
                    setSelectedBlockchain('bitcoin');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 165, 0, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 165, 0, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 165, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>₿</span>
                  <span style={{ color: 'white', fontSize: '14px' }}>Bitcoin</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveSection('send');
                    setSelectedBlockchain('ethereum');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(98, 126, 234, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(98, 126, 234, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(98, 126, 234, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(98, 126, 234, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>Ξ</span>
                  <span style={{ color: 'white', fontSize: '14px' }}>Ethereum</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveSection('send');
                    setSelectedBlockchain('polygon');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(130, 71, 229, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(130, 71, 229, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(130, 71, 229, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(130, 71, 229, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>⬟</span>
                  <span style={{ color: 'white', fontSize: '14px' }}>Polygon</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveSection('send');
                    setSelectedBlockchain('solana');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(20, 242, 149, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(20, 242, 149, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(20, 242, 149, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(20, 242, 149, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>◎</span>
                  <span style={{ color: 'white', fontSize: '14px' }}>Solana</span>
                </button>
              </div>
              
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(100, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(100, 255, 255, 0.2)'
              }}>
                <p style={{
                  color: 'white',
                  margin: 0,
                  fontSize: '15px',
                  lineHeight: '1.5'
                }}>
                  ✨ <strong>No complex addresses needed!</strong> People can send you crypto using just your FSN name: <span style={{
                    color: '#64ffff',
                    fontWeight: '700'
                  }}>{fsnName}.fsn</span>
                </p>
              </div>
            </div>

            {isAddingAddress && (
              <div className="add-address-form">
                <h4>Add New Address</h4>
                <form onSubmit={handleAddAddress}>
                  <div className="form-row">
                    <label>Blockchain</label>
                    <select 
                      value={newAddressBlockchain}
                      onChange={(e) => setNewAddressBlockchain(e.target.value)}
                    >
                      <option value="bitcoin">Bitcoin</option>
                      <option value="ethereum">Ethereum</option>
                      <option value="polygon">Polygon</option>
                      <option value="solana">Solana</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Label</label>
                    <input 
                      type="text"
                      value={newAddressLabel}
                      onChange={(e) => setNewAddressLabel(e.target.value)}
                      placeholder="e.g., My Bitcoin Wallet"
                    />
                  </div>
                  {sendError && <div className="error-message">{sendError}</div>}
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => {
                        setIsAddingAddress(false);
                        setSendError('');
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="submit-btn"
                      disabled={isSending}
                    >
                      {isSending ? 'Creating...' : 'Create Address'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {isLoadingAddresses ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading wallet addresses...</p>
              </div>
            ) : walletAddresses.length > 0 ? (
              <div className="addresses-list">
                {walletAddresses.map((address) => (
                  <div key={address.id} className="address-card">
                    <div className="address-header">
                      <div className="blockchain-icon">
                        <FsnHexagon size={30} />
                      </div>
                      <div className="address-info">
                        <h4>{address.label || formatBlockchainName(address.blockchain)}</h4>
                        <p className="address">{address.address}</p>
                      </div>
                      <div className="address-balance">
                        <span className="balance-label">Balance</span>
                        <span className="balance-amount">
                          {formatAmountWithSymbol(address.balance || '0', address.blockchain)}
                        </span>
                      </div>
                    </div>
                    <div className="address-footer">
                      <span className={`status-badge ${address.isActive ? 'active' : 'inactive'}`}>
                        {address.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="address-actions">
                        <button 
                          className="copy-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(address.address);
                            alert('Address copied to clipboard');
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <FsnHexagon size={60} />
                </div>
                <p>You don't have any wallet addresses yet</p>
                <button 
                  className="add-address-btn-large"
                  onClick={() => setIsAddingAddress(true)}
                >
                  + Add Your First Address
                </button>
              </div>
            )}
          </div>
        )}

        {activeSection === 'send' && (
          <div className="wallet-section">
            <h3>Send Crypto to FSN Name</h3>
            <p className="section-desc">
              Send cryptocurrency directly to any FSN name on the network
            </p>

            <form className="send-form" onSubmit={handleSendToFsn}>
              <div className="form-row">
                <label>From Blockchain</label>
                <select 
                  value={selectedBlockchain}
                  onChange={(e) => setSelectedBlockchain(e.target.value)}
                  disabled={isSending}
                >
                  <option value="bitcoin">Bitcoin</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="solana">Solana</option>
                </select>
              </div>
              
              <div className="form-row">
                <label>To FSN Name</label>
                <div style={{ 
                  position: 'relative', 
                  display: 'flex', 
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(100, 255, 255, 0.3)',
                  borderRadius: '25px',
                  padding: '12px 20px',
                  minHeight: '48px',
                  cursor: 'text'
                }}
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Enter your name"]') as HTMLInputElement;
                  if (input) input.focus();
                }}>
                  <input 
                    type="text"
                    value={recipientFsn}
                    onChange={(e) => setRecipientFsn(e.target.value)}
                    placeholder="Enter your name"
                    disabled={isSending}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'white',
                      fontSize: '16px',
                      padding: '0',
                      width: '100%',
                      minWidth: '0'
                    }}
                  />
                  <span style={{
                    color: '#64ffff',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginLeft: '10px',
                    pointerEvents: 'none'
                  }}>
                    .fsn
                  </span>
                </div>
              </div>
              
              <div className="form-row">
                <label>Amount</label>
                <input 
                  type="text"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.0"
                  disabled={isSending}
                />
              </div>
              
              <div className="form-row">
                <label>Note (Optional)</label>
                <input 
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's this payment for?"
                  disabled={isSending}
                />
              </div>

              {sendError && <div className="error-message">{sendError}</div>}
              {sendSuccess && <div className="success-message">{sendSuccess}</div>}

              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSending}
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        )}

        {activeSection === 'receive' && (
          <div className="wallet-section">
            <h3>Receive Crypto with Your FSN Name</h3>
            <p className="section-desc">
              Share your FSN name with others to receive cryptocurrency
            </p>

            <div className="receive-card">
              <div className="fsn-identity">
                <FsnHexagon size={80} />
                <h2 className="fsn-name">{fsnName}</h2>
              </div>
              
              <p className="receive-info">
                Anyone on the FreeSpace Network can send you crypto by using your FSN name: 
                <strong> {fsnName}</strong>
              </p>
              
              <button 
                className="copy-btn-large"
                onClick={() => {
                  navigator.clipboard.writeText(fsnName);
                  alert('FSN name copied to clipboard');
                }}
              >
                Copy FSN Name
              </button>
            </div>
          </div>
        )}

        {activeSection === 'transactions' && (
          <div className="wallet-section">
            <h3>Transaction History</h3>
            
            {isLoadingTransactions ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading transactions...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="transactions-list">
                <div className="transaction-header">
                  <div className="tx-date">Date</div>
                  <div className="tx-from">From</div>
                  <div className="tx-to">To</div>
                  <div className="tx-amount">Amount</div>
                  <div className="tx-status">Status</div>
                </div>
                
                {transactions.map((tx) => (
                  <div key={tx.id} className="transaction-row">
                    <div className="tx-date">{formatDate(tx.createdAt.toString())}</div>
                    <div className="tx-from" title={tx.fromAddress}>
                      {truncateAddress(tx.fromAddress)}
                    </div>
                    <div className="tx-to" title={tx.toAddress}>
                      {truncateAddress(tx.toAddress)}
                    </div>
                    <div className="tx-amount">{tx.amount}</div>
                    <div className="tx-status">{formatStatus(tx.status)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <FsnHexagon size={60} />
                </div>
                <p>No transactions yet</p>
                <button 
                  className="send-btn-large"
                  onClick={() => setActiveSection('send')}
                >
                  Make Your First Transaction
                </button>
              </div>
            )}
          </div>
        )}

        {activeSection === 'contacts' && (
          <div className="wallet-section">
            <AddressBook 
              userId={userId} 
              onSelectContact={handleContactSelect}
            />
          </div>
        )}
      </div>

      {/* Transaction Confirmation Dialog */}
      {showConfirmDialog && pendingTransaction && (
        <div className="confirmation-overlay" onClick={cancelTransaction}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirmation-header">
              <button 
                className="close-btn"
                onClick={cancelTransaction}
                aria-label="Close dialog"
              >
                ✕
              </button>
              <h3>⚠️ Confirm Transaction</h3>
              <p>Please review your transaction details carefully</p>
            </div>

            <div className="transaction-summary">
              <div className="summary-row">
                <span>From:</span>
                <div className="tx-from">
                  <span className={`fsn-name ${isUserVerified(pendingTransaction.fromAddress) ? 'fsn-name-verified' : ''}`}>
                    {pendingTransaction.fromAddress}
                  </span>
                  {isUserVerified(pendingTransaction.fromAddress) && (
                    <VerificationBadge size={12} glow={true} className="tx-from" />
                  )}
                </div>
              </div>
              <div className="summary-row">
                <span>To:</span>
                <div className="tx-to">
                  <span className={`fsn-name ${isUserVerified(pendingTransaction.toFsn) ? 'fsn-name-verified' : ''}`}>
                    {pendingTransaction.toFsn}
                  </span>
                  {isUserVerified(pendingTransaction.toFsn) && (
                    <VerificationBadge size={12} glow={true} className="tx-to" />
                  )}
                </div>
              </div>
              <div className="summary-row">
                <span>Amount:</span>
                <span className="amount">{pendingTransaction.amount} {pendingTransaction.cryptoType.toUpperCase()}</span>
              </div>
              <div className="summary-row">
                <span>Network Fee:</span>
                <span className="fee">{pendingTransaction.networkFee} {pendingTransaction.cryptoType.toUpperCase()}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span className="total-amount">{pendingTransaction.totalAmount} {pendingTransaction.cryptoType.toUpperCase()}</span>
              </div>
              {pendingTransaction.memo && (
                <div className="summary-row">
                  <span>Note:</span>
                  <span className="memo">"{pendingTransaction.memo}"</span>
                </div>
              )}
            </div>

            <div className="warning-section">
              <div className="warning-icon">🚨</div>
              <div className="warning-text">
                <h4>Important:</h4>
                <ul>
                  <li>This transaction is <strong>irreversible</strong> once confirmed</li>
                  <li>Double-check the recipient FSN name is correct</li>
                  <li>Network fees are non-refundable</li>
                  <li>Transaction may take 10-60 minutes to complete</li>
                </ul>
              </div>
            </div>

            <div className="confirmation-actions">
              <button 
                className="cancel-btn"
                onClick={cancelTransaction}
                disabled={isSending}
              >
                Cancel
              </button>
              <button 
                className="edit-btn"
                onClick={() => {
                  setShowConfirmDialog(false);
                  // Keep the form filled with current values - don't clear them
                }}
                disabled={isSending}
              >
                Edit Transaction
              </button>
              <button 
                className="confirm-btn"
                onClick={executeTransaction}
                disabled={isSending}
              >
                {isSending ? 'Processing...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletTab;