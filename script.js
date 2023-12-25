const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const defaultColorInput = document.getElementById('defaultColor');
const colorInput = document.getElementById('color');
const tableContainer = document.querySelector('.table-container');
const generatePanel = document.getElementById('generatePanel');
const editPanel = document.getElementById('editPanel');

// Global click detector
let clicked = false;
document.addEventListener('mousedown', () => clicked = true);
document.addEventListener('mouseup', () => clicked = false);

// Accordions
document.addEventListener('sl-show', event => {
    if (event.target.localName === 'sl-details') 
      document.querySelectorAll('sl-details').forEach(details => (details.open = event.target === details));
  });

// Initialize Color Selectors
function configureColorSelector(cs) {
    cs.querySelectorAll('.option').forEach(co => {
        co.style.backgroundColor = co.dataset.color;
        if(co.classList.contains('selected')) cs.dataset.value = co.dataset.color;
        co.addEventListener('click', () => {
            cs.querySelector('.option.selected').classList.remove('selected');
            co.classList.add('selected');
            cs.dataset.value = co.dataset.color;
        });
        
    })
}

document.querySelectorAll('.color-selector').forEach(configureColorSelector);

function generate() {
    tableContainer.innerHTML = '';
    const width = parseInt(widthInput.value), height = parseInt(heightInput.value);
    const table = document.createElement('table');
    const backgroundColor = defaultColorInput.dataset.value;
    const borderColor = glueColor.dataset.value;
    for (let i = 0; i < height; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < width; j++) {
            const td = document.createElement('td');
            td.style.backgroundColor = backgroundColor;
            td.style.borderColor = borderColor;
            td.addEventListener('mouseover', () => {
                if (!clicked) return;
                td.style.backgroundColor = colorInput.dataset.value;
            })
            td.addEventListener('touchstart', () => td.style.backgroundColor = colorInput.dataset.value)
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    tableContainer.appendChild(table);
}

// Generate Button
document.getElementById('generate').addEventListener('click', () => {
    generate();
    editPanel.show()
});

// Share Button 
document.getElementById('share').addEventListener('click', () => {
    

    // If device has sharing enabled, we trigger native share
    if (navigator.canShare) {
        domtoimage.toBlob(document.querySelector('table')).then(function (blob) {
            navigator.share({
                files: [new File([blob], "mosaicit.png", {type: blob.type,})],
            });
        });
        
        return;
    }


    domtoimage.toJpeg(document.querySelector('table'), { quality: 0.95 })
      .then(function (dataUrl) {
            var link = document.createElement('a');
            link.download = 'mosaicit.jpeg';
            link.href = dataUrl;
            link.click();
      });
})

const imageUpload = document.getElementById('imageUpload');
let activeCanvas, currentPixelData, currentGlueColor;

document.getElementById('upload').addEventListener('click', () => {
    imageUpload.click();
});

imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const originalCanvas = normalizeImage(img);
            activeCanvas = originalCanvas;
            const pixelatedCanvas = pixelateImage(originalCanvas);
            const html = `
            <sl-image-comparer>
                <img src="${originalCanvas.toDataURL()}" slot="before" />
                <img src="${pixelatedCanvas.toDataURL()}" slot="after" />
            </sl-image-comparer>
            <div class="controls">
                <div class="glue">
                    <h2>Color Pastina</h2>
                    <div class="color-selector" id="glueColor">
                        <div class="option" data-color="#FFFFFF"></div>
                        <div class="option selected" data-color="#f7ecdc"></div>
                        <div class="option" data-color="#70624c"></div>
                        <div class="option" data-color="#000000"></div>
                    </div>
                </div>
                <sl-range label="Pixelado" help-text="Píxeles por venecita" min="10" value="25" max="100"></sl-range>
            </div>
            `;
            Swal.fire({
                title: "Configurar",
                html,
                confirmButtonColor: "#68594a",
                didOpen(el) {
                    const afterImage = el.querySelector('sl-image-comparer img[slot="after"]');
                    const glueColorSelector = el.querySelector('.color-selector');
                    const pixelationRatio = el.querySelector('sl-range');
                    configureColorSelector(glueColorSelector);
                    const refreshCanvas = () => {
                        currentGlueColor = glueColorSelector.dataset.value;
                        const newPixelatedCanvas = pixelateImage(activeCanvas, pixelationRatio.value, glueColorSelector.dataset.value);
                        afterImage.src = newPixelatedCanvas.toDataURL();
                    };

                    glueColorSelector.addEventListener('click', refreshCanvas);
                    pixelationRatio.addEventListener('sl-change', refreshCanvas);
                }
            }).then(result => {
                console.log(currentPixelData);
                imageToTable(currentPixelData, currentGlueColor);
                editPanel.show()
            });
        };
        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    }
  });


setTimeout(generate, 500);


// Utility functions

function normalizeImage(originalImage, heightPixels = 500) {
    // Normalizes to a 1000 px height
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const aspectRatio = originalImage.height / originalImage.width;
    canvas.height = heightPixels;
    canvas.width = canvas.height / aspectRatio;
  
    context.clearRect(0,0,canvas.width, canvas.height);
    context.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height, 0, 0, canvas.width, canvas.height);
    
    return canvas;
   
}

function pixelateImage(originalCanvas, pixelationFactor = 25, glueColor = "#f7ecdc") {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext("2d");
    canvas.width = originalCanvas.width;
    canvas.height = originalCanvas.height;

    const originalImageData = originalCanvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    
    // We need to reserve 10% or at least 1 px for the glue
    const glueSize = Math.max(1, parseInt(pixelationFactor * 0.15));
    let i = 0, j = 0;
    if (pixelationFactor !== 0) {
        currentPixelData = []
        for (let y = 0; y < canvas.height; y += pixelationFactor) {
            currentPixelData[i] = [];
            j = 0;
            for (let x = 0; x < canvas.width; x += pixelationFactor) {
                // extracting the position of the sample pixel
                const pixelIndexPosition = (x + y * canvas.width) * 4;
                // First we draw a full square with glue color 
                context.fillStyle = glueColor;
                context.fillRect(x, y, pixelationFactor, pixelationFactor);
                // Now we draw an inner square leaving glueSize from below visible
                // drawing a square replacing the current pixels
                const currentPixel = `rgba(
                    ${originalImageData[pixelIndexPosition]},
                    ${originalImageData[pixelIndexPosition + 1]},
                    ${originalImageData[pixelIndexPosition + 2]},
                    ${originalImageData[pixelIndexPosition + 3]}
                )`;
                currentPixelData[i][j] = currentPixel;
                context.fillStyle = currentPixel;
                context.fillRect(x + glueSize, y + glueSize, pixelationFactor - glueSize, pixelationFactor - glueSize);
                j++;
            }
            i++;
        }
    }

    return canvas;
}

function imageToTable(pixelData, glueColor) {
    tableContainer.innerHTML = '';
    const table = document.createElement('table');
    for (let i = 0; i < pixelData.length; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < pixelData[i].length; j++) {
            const td = document.createElement('td')
            td.style.backgroundColor = pixelData[i][j];
            td.style.borderColor = glueColor;
            td.addEventListener('mouseover', () => {
                if (!clicked) return;
                td.style.backgroundColor = colorInput.dataset.value;
            })
            td.addEventListener('touchstart', () => td.style.backgroundColor = colorInput.dataset.value)
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    tableContainer.appendChild(table);
}