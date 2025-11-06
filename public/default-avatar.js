// This script converts the SVG avatar to a PNG file
document.addEventListener('DOMContentLoaded', function() {
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#e2e8f0"/>
    <circle cx="100" cy="70" r="40" fill="#93a5cf"/>
    <path d="M160,165c0,0-60-50-120,0c0,0,15,45,120,0Z" fill="#93a5cf"/>
  </svg>`;
  
  // Create a Blob from the SVG string
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  // Create an Image element
  const img = new Image();
  img.onload = function() {
    // Create a canvas to draw the image
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    // Convert canvas to PNG
    const pngUrl = canvas.toDataURL('image/png');
    
    // Create a link to download the PNG
    const link = document.createElement('a');
    link.download = 'default-avatar.png';
    link.href = pngUrl;
    
    // Create a PNG file and save it
    fetch(pngUrl)
      .then(res => res.blob())
      .then(blob => {
        // You could add code here to save the blob to your server
        console.log('PNG created successfully');
      });
    
    // Create fallback IMG tags for the avatar
    const fallbackImg = document.createElement('img');
    fallbackImg.src = pngUrl;
    fallbackImg.style.display = 'none';
    fallbackImg.id = 'default-avatar-png';
    document.body.appendChild(fallbackImg);
  };
  
  img.src = url;
}); 