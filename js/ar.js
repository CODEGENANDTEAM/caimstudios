// ar.js
const arcanvas = document.getElementById("tattooCanvas");
const arctx = arcanvas.getContext("2d");
const bodyPhotoInput = document.getElementById("bodyPhoto");
const tattooDesignInput = document.getElementById("tattooDesign");
const overlayMessage = document.getElementById("overlayMessage");

// Canvas dimensions
arcanvas.width = arcanvas.parentElement.clientWidth;
arcanvas.height = 400;

// Image objects
let bodyImage = null;
let tattooImage = null;

// Tattoo position, size, and rotation
let tattoo = {
    x: 150,
    y: 150,
    width: 100,
    height: 100,
    angle: 0, // Rotation angle in degrees
    dragging: false,
};

// Load body photo
bodyPhotoInput.addEventListener("change", (e) => {
    loadFile(e.target.files[0], (img) => {
        bodyImage = img;
        drawCanvas();
    });
});

// Load tattoo design
tattooDesignInput.addEventListener("change", (e) => {
    loadFile(e.target.files[0], (img) => {
        removeImageBackground(img, (processedImage) => {
            tattooImage = processedImage;
            drawCanvas();
        });
    });
});

// Load file helper
function loadFile(file, callback) {
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => callback(img);
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}

// Remove the background of the tattoo image
function removeImageBackground(img, callback) {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;

    tempCtx.drawImage(img, 0, 0, img.width, img.height);
    const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Remove white or near-white background
        if (r > 230 && g > 230 && b > 230) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
    }

    tempCtx.putImageData(imageData, 0, 0);
    const processedImage = new Image();
    processedImage.onload = () => callback(processedImage);
    processedImage.src = tempCanvas.toDataURL();
}

// Draw on canvas
function drawCanvas() {
    arctx.clearRect(0, 0, arcanvas.width, arcanvas.height);
    if (bodyImage) {
        arctx.drawImage(bodyImage, 0, 0, arcanvas.width, arcanvas.height);
    }
    if (tattooImage) {
        drawRotatedImage(
            tattooImage,
            tattoo.x,
            tattoo.y,
            tattoo.width,
            tattoo.height,
            tattoo.angle
        );
    }
    overlayMessage.style.display = bodyImage && tattooImage ? "none" : "block";
}

// Helper to draw rotated images
function drawRotatedImage(image, x, y, width, height, angle) {
    arctx.save();
    arctx.translate(x + width / 2, y + height / 2); // Move to the center of the tattoo
    arctx.rotate((angle * Math.PI) / 180); // Convert angle to radians and rotate
    arctx.drawImage(image, -width / 2, -height / 2, width, height); // Draw image centered at new origin
    arctx.restore();
}

// Mouse events for dragging
arcanvas.addEventListener("mousedown", (e) => {
    const { offsetX, offsetY } = e;
    if (
        offsetX >= tattoo.x &&
        offsetX <= tattoo.x + tattoo.width &&
        offsetY >= tattoo.y &&
        offsetY <= tattoo.y + tattoo.height
    ) {
        tattoo.dragging = true;
    }
});

arcanvas.addEventListener("mousemove", (e) => {
    if (tattoo.dragging) {
        tattoo.x = e.offsetX - tattoo.width / 2;
        tattoo.y = e.offsetY - tattoo.height / 2;
        drawCanvas();
    }
});

arcanvas.addEventListener("mouseup", () => {
    tattoo.dragging = false;
});

// Resize tattoo with mouse wheel
arcanvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    tattoo.width += e.deltaY < 0 ? 10 : -10;
    tattoo.height += e.deltaY < 0 ? 10 : -10;
    drawCanvas();
});

// Rotate tattoo with keyboard
document.addEventListener("keydown", (e) => {
    if (tattooImage) {
        if (e.key === "ArrowLeft") {
            tattoo.angle -= 5; // Rotate anti-clockwise
        } else if (e.key === "ArrowRight") {
            tattoo.angle += 5; // Rotate clockwise
        }
        drawCanvas();
    }
});
