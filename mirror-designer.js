// Initialize Fabric.js canvas
const canvas = new fabric.Canvas('canvas');
const glueColorInput = document.querySelector('#glueColor');
const mirrorDiameter = document.querySelector('.length-input.mirror-diameter');
// Subtract 10px margin on both sides
const availableWidth = document.querySelector('.mirror-container').clientWidth - 20;
canvas.setHeight(availableWidth);
canvas.setWidth(availableWidth);

let totalRows = 0;

function configureLengthInput(el) {
    const lengthValue = el.querySelector('.length-value');
    el.querySelectorAll('.length-input-control').forEach(c => c.addEventListener('click', () => {
        const currentValue = parseInt(el.dataset.value);
        const max = parseInt(el.dataset.max);
        const min = parseInt(el.dataset.min);
        const step = parseInt(c.dataset.step);
        const nextValue = currentValue + step;
        console.log(nextValue)
        if (nextValue > max || nextValue < min) return;
        el.dataset.value = nextValue;
        lengthValue.innerText = nextValue;
        document.dispatchEvent(new Event('mirror_changed'))
    }));
}

document.querySelectorAll('.length-input').forEach(configureLengthInput);

// Glue color input configured separately from the rest
glueColorInput.addEventListener('change', () => document.dispatchEvent(new Event('mirror_changed')));

function configureColorInput(el) {
    el.type = "color";
    el.value = "#68594a";
    el.classList.add("form-control", "form-control-color");
    el.addEventListener('change', () => document.dispatchEvent(new Event('mirror_changed')));
}

function reindexRows() {
    totalRows = 0;
    document.querySelector('.mirror-rows').querySelectorAll('.mirror-row').forEach((el, idx) => {
        el.dataset.index = idx + 1;
        el.querySelector('.row-number').innerText = idx + 1;
        totalRows++;
    });
}

function addRow(kind) {
    const rowParent = document.querySelector('.mirror-rows');
    const newRow = document.getElementById(kind).content.cloneNode(true);
    // Set Row number
    const idx = totalRows + 1;
    newRow.querySelector('.mirror-row').dataset.index = idx;
    newRow.querySelector('.row-number').innerText = idx;
    newRow.querySelectorAll('.length-input').forEach(configureLengthInput);
    newRow.querySelector('.remove-row').addEventListener('click', () => {
        rowParent.removeChild(rowParent.querySelector(`.mirror-row[data-index="${idx}"]`));
        reindexRows();
    });
    // Row might not have colorInput
    const colorInput = newRow.querySelector('.pattern > .colors > .form-control-color')
    if (colorInput) {
        const colorContainer = colorInput.parentElement;
        Sortable.create(colorContainer);
        configureColorInput(colorInput);
        // Now configure the add delete if this row allows colors
        newRow.querySelector('.add-color').addEventListener('click', () => {
            const newColorInput = document.createElement('input');
            configureColorInput(newColorInput);
            colorContainer.appendChild(newColorInput);
            document.dispatchEvent(new Event('mirror_changed'))
        })

        newRow.querySelector('.remove-color').addEventListener('click', () => {
            if(colorContainer.querySelectorAll('.form-control-color').length < 2) return; // Always leave 1 color
            colorContainer.removeChild(colorContainer.querySelector(".form-control-color:last-child"));
            document.dispatchEvent(new Event('mirror_changed'))
        })
    }
    rowParent.appendChild(newRow);
   
    totalRows++;
    document.dispatchEvent(new Event('mirror_changed'))
}

document.querySelectorAll('.new-row').forEach(e => e.addEventListener('click', () => addRow(e.dataset.template)));

function getMirrorData() {
    // To cm
    const mirrorRadius = parseInt(mirrorDiameter.dataset.value) * 10;
    const glueColor = glueColorInput.value;
    const rows = [];
    document.querySelectorAll(".mirror-rows > .mirror-row").forEach(r => {
        const pattern = [];
        r.querySelectorAll('.pattern > .colors > .form-control-color').forEach(c => pattern.push(c.value));
        switch(r.dataset.row) {
            case "square":
                rows.push({
                    type: "square", 
                    size: parseInt(r.querySelector('.length-input.size').dataset.value),
                    gap: parseInt(r.querySelector('.length-input.gap').dataset.value),
                    pattern,
                });
                break;
            case "rectangle":
                rows.push({
                    type: "rectangle", 
                    height: parseInt(r.querySelector('.length-input.height').dataset.value),
                    width: parseInt(r.querySelector('.length-input.width').dataset.value),
                    gap: parseInt(r.querySelector('.length-input.gap').dataset.value),
                    pattern,
                });
                break;
            case "circle":
                rows.push({
                    type: "circle", 
                    radius: parseInt(r.querySelector('.length-input.diameter').dataset.value) / 2,
                    gap: parseInt(r.querySelector('.length-input.gap').dataset.value),
                    pattern,
                });
                break;
            case "gap":
                rows.push({
                    type: "gap", 
                    gap: parseInt(r.querySelector('.length-input.gap').dataset.value),
                });
                break;
        }
    });
    return {mirrorRadius, glueColor, rows};
}

function draw(mirrorData) {
    canvas.clear();
    const { mirrorRadius, glueColor } = mirrorData;
    drawMirror(mirrorRadius);
    let currentRadius = mirrorRadius;
    for (let i = 0; i < mirrorData.rows.length; i++) {
        const row = mirrorData.rows[i];
        switch(row.type) {
            case "square": 
                drawRectanglesRow(currentRadius, row.pattern, row.gap, row.size, row.size);
                currentRadius += row.size;
                break;
            case "rectangle":
                drawRectanglesRow(currentRadius, row.pattern, row.gap, row.height, row.width);
                currentRadius += row.width;
                break;
            case "circle":
                drawCirclesRow(currentRadius, row.pattern, row.gap, row.radius);
                currentRadius += row.radius * 2;
                break;
            case "gap":
                // Do nothing, increasing gap below is the same.
                break;
        }   
        currentRadius += 2 * row.gap;
    }
    drawGlue(currentRadius, glueColor)
    // finally zoom out to make it enter perfectly on screen
}

function drawMirror(radius) {
    const circle = new fabric.Circle({
        radius,
        left: canvas.width / 2 - radius,
        top: canvas.height / 2 - radius,
        fill: 'grey',
        stroke: 'grey',
    });
    canvas.add(circle);
}

function drawGlue(radius, color) {
    const circle = new fabric.Circle({
        radius,
        left: canvas.width / 2 - radius,
        top: canvas.height / 2 - radius,
        fill: color,
        stroke: color,
    });
    canvas.add(circle);
    circle.sendToBack();
}

function drawRectanglesRow(radius, pattern, gap, height, width) {
    // Calculate the number of squares needed
    const circumference = 2 * Math.PI * radius;
    const num = Math.floor(circumference / (height + gap));
    // Draw squares along the circumference of the circle
    for (let i = 0; i < num; i++) {
        const angle = (i * 2 * Math.PI) / num;
        const angleDegrees = angle / Math.PI * 180;
        const left = canvas.width / 2 + (radius + width / 2 + gap) * Math.cos(angle);
        const top = canvas.height / 2 + (radius + width / 2 + gap) * Math.sin(angle);
        const color = pattern[i % pattern.length];
        const rect = new fabric.Rect({
            height,
            width,
            originX: 'center',
            originY: 'center',
            left,
            top,
            fill: color,
            stroke: color,
        });
        rect.setCoords();
        rect.rotate(angleDegrees);
        canvas.add(rect);
    }
}

function drawCirclesRow(radius, pattern, gap, circleRadius) {
    // Calculate the number of squares needed
    const circumference = 2 * Math.PI * radius;
    const num = Math.floor(circumference / (2 * circleRadius + gap));
    // Draw squares along the circumference of the circle
    for (let i = 0; i < num; i++) {
        const angle = (i * 2 * Math.PI) / num;
        const left = canvas.width / 2 + (radius + circleRadius + gap) * Math.cos(angle);
        const top = canvas.height / 2 + (radius + circleRadius + gap) * Math.sin(angle);
        const color = pattern[i % pattern.length];
        const circ = new fabric.Circle({
            radius: circleRadius,
            originX: 'center',
            originY: 'center',
            left,
            top,
            fill: color,
            stroke: color,
        });
        circ.setCoords();
        canvas.add(circ);
    }
}

// Init
addRow('squareRow');
draw(getMirrorData());
document.addEventListener('mirror_changed', () => draw(getMirrorData()));