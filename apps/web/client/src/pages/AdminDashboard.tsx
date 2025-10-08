import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import SharedNetworkAnimation from "@/components/SharedNetworkAnimation";
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types for our domain data
interface FsnDomain {
  id: number;
  name: string;
  status: "available" | "registered" | "reserved" | "banned";
  ownerId: number | null;
  ownerEmail?: string | null; // Added for email display
  reservedReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  expiresAt: string | null;
}

interface ReservedName {
  id: number;
  name: string;
  reason: string | null;
  createdBy: number | null;
  createdAt: string | null;
  isActive: boolean | null;
}

interface AdminLog {
  id: number;
  adminId: number;
  action: string;
  targetTable: string | null;
  targetId: number | null;
  details: string | null;
  createdAt: string | null;
}

interface DomainStats {
  total: number;
  registered: number;
  reserved: number;
  available: number;
}

// Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [adminId, setAdminId] = useState<number | null>(null);
  const [adminName, setAdminName] = useState<string>("");
  const [domainsData, setDomainsData] = useState<FsnDomain[]>([]);
  const [reservedNamesData, setReservedNamesData] = useState<ReservedName[]>([]);
  const [adminLogsData, setAdminLogsData] = useState<AdminLog[]>([]);
  const [domainStats, setDomainStats] = useState<DomainStats>({
    total: 0,
    registered: 0,
    reserved: 0,
    available: 0
  });
  const [loading, setLoading] = useState({
    domains: false,
    usernames: false,
    reservedNames: false,
    adminLogs: false
  });
  
  // Registered FSN usernames list
  const [registeredUsernames, setRegisteredUsernames] = useState<FsnDomain[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  
  // Form states
  const [reserveNameForm, setReserveNameForm] = useState({
    name: "",
    reason: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Load registered usernames and domain stats on component mount
  useEffect(() => {
    // These are public endpoints that don't require admin auth
    loadRegisteredUsernames();
    loadDomainStats();
  }, []);
  
  // Admin Authentication
  const handleAdminLogin = async () => {
    setAuthLoading(true);
    
    try {
      // For demo purposes, automatically log in as admin
      const id = 1; // Admin ID for demo
      
      // Check if user exists and is admin
      const adminCheck = await fetch(`/api/user/${id}`);
      if (!adminCheck.ok) {
        throw new Error("Admin user not found");
      }
      
      setAdminId(id);
      setAdminName(`Admin User`);
      
      // Load all admin data
      await loadAllData();
      
      toast({
        title: "Admin login successful",
        description: "You now have access to the admin dashboard"
      });
    } catch (error) {
      console.error("Admin login error:", error);
      toast({
        title: "Admin login failed",
        description: "Could not authenticate as admin",
        variant: "destructive"
      });
    } finally {
      setAuthLoading(false);
    }
  };
  
  const handleLogout = () => {
    // Clear admin session from localStorage
    localStorage.removeItem("fsn_admin_logged_in");
    // Redirect to login page
    setLocation("/admin-login");
  };
  
  // Data loading functions
  const loadAllData = async () => {
    // Load usernames and domain stats even without admin ID
    await loadRegisteredUsernames();
    await loadDomainStats();
    
    // Only load admin-specific data if we have an admin ID
    if (adminId) {
      await Promise.all([
        loadDomains(),
        loadReservedNames(),
        loadAdminLogs()
      ]);
    }
  };
  
  // Load all registered FSN usernames
  const loadRegisteredUsernames = async () => {
    try {
      setLoading(prev => ({ ...prev, usernames: true }));
      
      // Use the public API endpoint for registered domains
      const response = await fetch(`/api/fsn/domains/registered`);
      
      if (!response.ok) {
        throw new Error('Failed to load registered usernames');
      }
      
      const data = await response.json();
      console.log("Registered usernames loaded:", data);
      setRegisteredUsernames(data || []);
    } catch (error) {
      console.error("Failed to load registered usernames:", error);
      toast({
        title: "Error loading usernames",
        description: "Could not fetch registered usernames",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, usernames: false }));
    }
  };
  
  const loadDomains = async (status = statusFilter, query = searchQuery) => {
    if (!adminId) return;
    
    try {
      setLoading(prev => ({ ...prev, domains: true }));
      
      let url = `/api/admin/domains?limit=100`;
      if (status && status !== "all") {
        url += `&status=${status}`;
      }
      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Admin-ID': adminId.toString()
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load domains');
      }
      
      const data = await response.json();
      setDomainsData(data || []);
    } catch (error) {
      console.error("Failed to load domains:", error);
      toast({
        title: "Error loading domains",
        description: "Could not fetch domain data",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, domains: false }));
    }
  };
  
  const loadReservedNames = async () => {
    if (!adminId) return;
    
    try {
      setLoading(prev => ({ ...prev, reservedNames: true }));
      
      const response = await fetch(`/api/admin/reserved?limit=100`, {
        method: 'GET',
        headers: {
          'Admin-ID': adminId.toString()
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load reserved names');
      }
      
      const data = await response.json();
      setReservedNamesData(data || []);
    } catch (error) {
      console.error("Failed to load reserved names:", error);
      toast({
        title: "Error loading reserved names",
        description: "Could not fetch reserved names data",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, reservedNames: false }));
    }
  };
  
  const loadAdminLogs = async () => {
    if (!adminId) return;
    
    try {
      setLoading(prev => ({ ...prev, adminLogs: true }));
      
      const response = await fetch(`/api/admin/logs?limit=100`, {
        method: 'GET',
        headers: {
          'Admin-ID': adminId.toString()
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load admin logs');
      }
      
      const data = await response.json();
      setAdminLogsData(data || []);
    } catch (error) {
      console.error("Failed to load admin logs:", error);
      toast({
        title: "Error loading admin logs",
        description: "Could not fetch admin logs data",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, adminLogs: false }));
    }
  };
  
  const loadDomainStats = async () => {
    try {
      const response = await fetch(`/api/fsn/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to load domain stats');
      }
      
      const data = await response.json();
      console.log("Domain stats loaded:", data);
      setDomainStats(data || {
        total: 0,
        registered: 0,
        reserved: 0,
        available: 0
      });
    } catch (error) {
      console.error("Failed to load domain stats:", error);
    }
  };
  
  // Action handlers
  const handleReserveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId) return;
    
    const { name, reason } = reserveNameForm;
    if (!name || !reason) {
      toast({
        title: "Missing fields",
        description: "Name and reason are required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/reserved`, {
        method: 'POST',
        headers: {
          'Admin-ID': adminId.toString(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, reason })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reserve name');
      }
      
      toast({
        title: "Name reserved",
        description: `Successfully reserved ${name}.fsn`,
      });
      
      // Reset form and reload data
      setReserveNameForm({ name: "", reason: "" });
      await Promise.all([
        loadReservedNames(),
        loadAdminLogs(),
        loadDomainStats()
      ]);
    } catch (error) {
      console.error("Failed to reserve name:", error);
      toast({
        title: "Error reserving name",
        description: error instanceof Error ? error.message : "Could not reserve the domain name",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteReservedName = async (id: number, name: string) => {
    if (!adminId) return;
    
    if (!confirm(`Are you sure you want to delete the reservation for ${name}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/reserved/${id}`, {
        method: 'DELETE',
        headers: {
          'Admin-ID': adminId.toString(),
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete reservation');
      }
      
      toast({
        title: "Reservation deleted",
        description: `Successfully deleted reservation for ${name}`
      });
      
      await Promise.all([
        loadReservedNames(),
        loadAdminLogs(),
        loadDomainStats()
      ]);
    } catch (error) {
      console.error("Failed to delete reservation:", error);
      toast({
        title: "Error deleting reservation",
        description: error instanceof Error ? error.message : "Could not delete the reservation",
        variant: "destructive"
      });
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDomains(statusFilter, searchQuery);
  };
  
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    loadDomains(newStatus, searchQuery);
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };
  
  if (!adminId) {
    return (
      <div className="admin-login">
        <Navigation />
        <SharedNetworkAnimation className="network-background" />
        <div className="admin-login-container" style={{ 
          background: 'rgba(10, 20, 40, 0.85)', 
          padding: '2rem', 
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
          maxWidth: '600px',
          margin: '0 auto',
          marginTop: '100px',
          boxShadow: '0 0 20px rgba(100, 255, 255, 0.2)'
        }}>
          <h1 style={{ color: '#64ffff', textAlign: 'center', marginBottom: '1.5rem' }}>
            FSN Admin Dashboard
          </h1>
          <p style={{ color: '#e0e7f2', textAlign: 'center', marginBottom: '2rem' }}>
            You need admin privileges to access this page.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button 
              onClick={handleAdminLogin} 
              disabled={authLoading}
              style={{ 
                background: '#64ffff', 
                color: '#0a1428',
                fontWeight: 'bold'
              }}
            >
              {authLoading ? "Authenticating..." : "Login as Admin"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
              style={{ 
                borderColor: '#64ffff', 
                color: '#64ffff'
              }}
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-dashboard">
      <SharedNetworkAnimation className="network-background" />
      <div className="admin-header" style={{ 
        background: 'rgba(10, 20, 40, 0.85)', 
        padding: '1rem 2rem',
        backdropFilter: 'blur(10px)',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(100, 255, 255, 0.2)'
      }}>
        <div className="admin-title">
          <h1 style={{ color: '#64ffff', margin: 0 }}>FSN Admin Dashboard</h1>
          <p style={{ color: '#a0b9d0', margin: '0.5rem 0 0 0' }}>Logged in as {adminName}</p>
        </div>
        <div className="admin-actions" style={{ display: 'flex', gap: '1rem' }}>
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            style={{ borderColor: '#64ffff', color: '#64ffff' }}
          >
            View Homepage
          </Button>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            style={{ borderColor: '#ff6b6b', color: '#ff6b6b' }}
          >
            Logout
          </Button>
        </div>
      </div>
      
      <div className="admin-stats" style={{ 
        display: 'flex',
        justifyContent: 'space-around', 
        margin: '0 auto 2rem auto',
        maxWidth: '1200px',
        background: 'rgba(10, 20, 40, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 0 15px rgba(100, 255, 255, 0.1)'
      }}>
        <div className="stat-item" style={{ textAlign: 'center', padding: '1rem' }}>
          <span style={{ display: 'block', color: '#a0b9d0', marginBottom: '0.5rem' }}>Total Domains</span>
          <span style={{ display: 'block', color: '#64ffff', fontSize: '1.75rem', fontWeight: 'bold' }}>{domainStats.total}</span>
        </div>
        <div className="stat-item" style={{ textAlign: 'center', padding: '1rem' }}>
          <span style={{ display: 'block', color: '#a0b9d0', marginBottom: '0.5rem' }}>Registered</span>
          <span style={{ display: 'block', color: '#4ade80', fontSize: '1.75rem', fontWeight: 'bold' }}>{domainStats.registered}</span>
        </div>
        <div className="stat-item" style={{ textAlign: 'center', padding: '1rem' }}>
          <span style={{ display: 'block', color: '#a0b9d0', marginBottom: '0.5rem' }}>Reserved</span>
          <span style={{ display: 'block', color: '#f59e0b', fontSize: '1.75rem', fontWeight: 'bold' }}>{domainStats.reserved}</span>
        </div>
        <div className="stat-item" style={{ textAlign: 'center', padding: '1rem' }}>
          <span style={{ display: 'block', color: '#a0b9d0', marginBottom: '0.5rem' }}>Available</span>
          <span style={{ display: 'block', color: '#3b82f6', fontSize: '1.75rem', fontWeight: 'bold' }}>{domainStats.available}</span>
        </div>
      </div>
      
      <Tabs 
        defaultValue="usernames" 
        className="admin-tabs"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'rgba(10, 20, 40, 0.85)',
          borderRadius: '8px',
          padding: '2rem',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 15px rgba(100, 255, 255, 0.1)',
          maxHeight: 'calc(100vh - 240px)',
          overflowY: 'auto'
        }}
      >
        <TabsList style={{ 
          marginBottom: '2rem', 
          background: 'rgba(28, 36, 59, 0.6)',
          borderRadius: '6px',
          padding: '0.25rem'
        }}>
          <TabsTrigger 
            value="usernames" 
            style={{ 
              color: '#64ffff', 
              fontWeight: 'bold',
              padding: '0.75rem 1.25rem'
            }}
          >
            FSN Usernames
          </TabsTrigger>
          <TabsTrigger 
            value="domains" 
            style={{ 
              color: '#a0b9d0',
              padding: '0.75rem 1.25rem'
            }}
          >
            All Domains
          </TabsTrigger>
          <TabsTrigger 
            value="reserved" 
            style={{ 
              color: '#a0b9d0',
              padding: '0.75rem 1.25rem'
            }}
          >
            Reserved Names
          </TabsTrigger>
          <TabsTrigger 
            value="logs" 
            style={{ 
              color: '#a0b9d0',
              padding: '0.75rem 1.25rem'
            }}
          >
            Admin Logs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="domains" className="admin-tab-content">
          <div className="domains-filter">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input">
                <Input
                  type="text"
                  placeholder="Search domains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit">Search</Button>
              </div>
              
              <div className="status-filter">
                <Label htmlFor="status-filter">Status:</Label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="status-select"
                >
                  <option value="all">All</option>
                  <option value="registered">Registered</option>
                  <option value="reserved">Reserved</option>
                  <option value="available">Available</option>
                </select>
              </div>
            </form>
          </div>
          
          {loading.domains ? (
            <div className="loading">Loading domains...</div>
          ) : (
            <div className="domains-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner ID</TableHead>
                    <TableHead>Reserved Reason</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domainsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No domains found</TableCell>
                    </TableRow>
                  ) : (
                    domainsData.map((domain) => (
                      <TableRow key={domain.id}>
                        <TableCell>{domain.name}.fsn</TableCell>
                        <TableCell>
                          <span className={`status-badge status-${domain.status}`}>
                            {domain.status}
                          </span>
                        </TableCell>
                        <TableCell>{domain.ownerId || "N/A"}</TableCell>
                        <TableCell>{domain.reservedReason || "N/A"}</TableCell>
                        <TableCell>{formatDate(domain.createdAt)}</TableCell>
                        <TableCell>{formatDate(domain.updatedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="usernames" className="admin-tab-content">
          <div className="usernames-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#64ffff', fontSize: '1.5rem', margin: 0 }}>All Registered FSN Usernames</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Input 
                    type="text" 
                    placeholder="Search usernames..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                      background: 'rgba(28, 36, 59, 0.6)',
                      border: '1px solid rgba(100, 255, 255, 0.2)',
                      color: '#e0e7f2',
                      width: '250px',
                      padding: '0.5rem 1rem'
                    }}
                  />
                </div>
              </div>
            </div>
            {loading.usernames ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#64ffff',
                fontSize: '1.1rem'
              }}>
                Loading registered usernames...
              </div>
            ) : (
              <div className="usernames-table">
                <Table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                  <TableHeader>
                    <TableRow style={{ 
                      background: 'rgba(28, 36, 59, 0.8)',
                      borderBottom: '1px solid rgba(100, 255, 255, 0.2)'
                    }}>
                      <TableHead style={{ padding: '1rem', color: '#64ffff', fontWeight: 'bold' }}>FSN Username</TableHead>
                      <TableHead style={{ padding: '1rem', color: '#64ffff', fontWeight: 'bold' }}>Owner ID</TableHead>
                      <TableHead style={{ padding: '1rem', color: '#64ffff', fontWeight: 'bold' }}>Email Address</TableHead>
                      <TableHead style={{ padding: '1rem', color: '#64ffff', fontWeight: 'bold' }}>Registration Date</TableHead>
                      <TableHead style={{ padding: '1rem', color: '#64ffff', fontWeight: 'bold' }}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registeredUsernames.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} style={{ 
                          textAlign: 'center', 
                          padding: '2rem', 
                          color: '#a0b9d0',
                          background: 'rgba(20, 28, 48, 0.6)'
                        }}>
                          No registered usernames found
                        </TableCell>
                      </TableRow>
                    ) : registeredUsernames.filter(domain => 
                        searchQuery === "" || domain.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} style={{ 
                          textAlign: 'center', 
                          padding: '2rem', 
                          color: '#a0b9d0',
                          background: 'rgba(20, 28, 48, 0.6)'
                        }}>
                          No usernames match your search
                        </TableCell>
                      </TableRow>
                    ) : (
                      registeredUsernames
                        .filter(domain => searchQuery === "" || domain.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((domain) => (
                        <TableRow key={domain.id} style={{
                          background: 'rgba(20, 28, 48, 0.6)',
                          borderBottom: '1px solid rgba(100, 255, 255, 0.1)',
                          transition: 'all 0.2s ease'
                        }}>
                          <TableCell style={{ padding: '1rem', color: '#e0e7f2' }}>
                            <strong style={{ color: '#64ffff' }}>{domain.name}.fsn</strong>
                          </TableCell>
                          <TableCell style={{ padding: '1rem', color: '#e0e7f2' }}>{domain.ownerId || "N/A"}</TableCell>
                          <TableCell style={{ padding: '1rem', color: '#e0e7f2' }}>
                            {domain.ownerEmail ? (
                              <a href={`mailto:${domain.ownerEmail}`} style={{ color: '#64ffff', textDecoration: 'underline' }}>
                                {domain.ownerEmail}
                              </a>
                            ) : (
                              <span style={{ color: '#888' }}>No email on file</span>
                            )}
                          </TableCell>
                          <TableCell style={{ padding: '1rem', color: '#e0e7f2' }}>{formatDate(domain.createdAt)}</TableCell>
                          <TableCell style={{ padding: '1rem' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              background: '#4ade80',
                              color: '#0a1428',
                              fontWeight: 'bold',
                              fontSize: '0.85rem'
                            }}>
                              Active
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="reserved" className="admin-tab-content">
          <div className="reserved-names-section">
            <div className="reserve-form-container">
              <h3>Reserve a New Name</h3>
              <form onSubmit={handleReserveName} className="reserve-form">
                <div className="form-group">
                  <Label htmlFor="name">Name (without .fsn)</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g. admin"
                    value={reserveNameForm.name}
                    onChange={(e) => setReserveNameForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="form-group">
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    type="text"
                    placeholder="Why is this name being reserved?"
                    value={reserveNameForm.reason}
                    onChange={(e) => setReserveNameForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
                
                <Button type="submit">Reserve Name</Button>
              </form>
            </div>
            
            <div className="reserved-names-list">
              <h3>Reserved Names</h3>
              {loading.reservedNames ? (
                <div className="loading">Loading reserved names...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservedNamesData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No reserved names found</TableCell>
                      </TableRow>
                    ) : (
                      reservedNamesData.map((reservedName) => (
                        <TableRow key={reservedName.id}>
                          <TableCell>{reservedName.name}.fsn</TableCell>
                          <TableCell>{reservedName.reason || "N/A"}</TableCell>
                          <TableCell>{reservedName.createdBy || "N/A"}</TableCell>
                          <TableCell>{formatDate(reservedName.createdAt)}</TableCell>
                          <TableCell>{reservedName.isActive ? "Yes" : "No"}</TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteReservedName(reservedName.id, reservedName.name)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="logs" className="admin-tab-content">
          <div className="logs-table">
            <h3>Admin Action Logs</h3>
            {loading.adminLogs ? (
              <div className="loading">Loading admin logs...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminLogsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No admin logs found</TableCell>
                    </TableRow>
                  ) : (
                    adminLogsData.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.id}</TableCell>
                        <TableCell>{log.adminId}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.targetTable ? `${log.targetTable} #${log.targetId}` : "N/A"}</TableCell>
                        <TableCell>{log.details || "N/A"}</TableCell>
                        <TableCell>{formatDate(log.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;