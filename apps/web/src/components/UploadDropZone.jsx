import React, { useRef } from "react";
import { HiUpload } from "react-icons/hi";

const UploadDropZone = ({ onUpload }) => {
  const fileInputRef = useRef();

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    onUpload(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    onUpload(files);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div
      className="w-full max-w-md mx-auto bg-gray-900 rounded-lg shadow-xl ring-4 ring-blue-500 ring-opacity-50 p-12 flex flex-col items-center justify-center cursor-pointer transform transition-transform duration-300 hover:scale-105"
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <HiUpload className="text-blue-400 text-6xl mb-6" />
      <p className="text-white text-xl font-semibold">
        Click or drag files to upload
      </p>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default UploadDropZone;
