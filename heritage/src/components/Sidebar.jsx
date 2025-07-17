

import React from "react";
import "./Sidebar.css";

const images = import.meta.glob('../assets/images/*.{jpg,jpeg,png}', {
  eager: true,
  import: 'default',
});

const imageData = Object.entries(images).map(([path, src]) => {
  const fileName = path.split('/').pop(); // e.g., "Chettinad Heritage Mansions – Karaikudi.jpg"
  const [namePart] = fileName.split(".");
  const [title, location] = namePart.split(" – ").map(str => str.trim());

  return {
    src,
    title,
    location,
  };
});

const Sidebar = () => {
  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Sidebar</h2>
        <ul>
          <li>Dashboard</li>
          <li>Settings</li>
          <li>Profile</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {imageData.map((img, index) => (
          <div key={index} className="img-wrapper">
            <img src={img.src} alt={img.title} />
            <div className="overlay">
              <h3>{img.title}</h3>
              <p>{img.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
