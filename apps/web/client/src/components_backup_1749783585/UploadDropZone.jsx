import React, { useRef } from 'react';

const UploadDropZone = ({ onUpload }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    onUpload(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    onUpload(files);
  };

  return (
    <div
      className="w-full h-64 bg-gray-900 border-dashed border-4 border-blue-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors duration-200"
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="text-center">
        <div className="text-white text-xl font-semibold">
          Drag files here or click to upload
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default UploadDropZone;