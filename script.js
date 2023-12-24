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
document.querySelectorAll('.color-selector').forEach(cs => 
    cs.querySelectorAll('.option').forEach(co => {
        co.style.backgroundColor = co.dataset.color;
        if(co.classList.contains('selected')) cs.dataset.value = co.dataset.color;
        co.addEventListener('click', () => {
            cs.querySelector('.option.selected').classList.remove('selected');
            co.classList.add('selected');
            cs.dataset.value = co.dataset.color;
        });
        
    })
);

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
                title: "Mosaic.it Designer",
                text: "Encargá tu propio diseño!",
                files: [new File([blob], "mosaicit.png", {type: blob.type,})],
                url: window.location.href,
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



   


setTimeout(generate, 500);