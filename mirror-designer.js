// Initialize Fabric.js canvas
const canvas = new fabric.Canvas('canvas');
// Subtract 10px margin on both sides
const availableWidth = document.querySelector('.mirror-container').clientWidth - 20;
canvas.setHeight(availableWidth);
canvas.setWidth(availableWidth);

let totalRows = 0;

draw({
    mirrorRadius: 200, 
    rows: [{type: "square", size: 20, gap: 5, pattern: ["#68594a"]}], 
    glueColor: '#f7ecdc'}
);
addRow('rectangleRow');

function addRow(kind) {
    const newRow = document.getElementById(kind).content.cloneNode(true);
    // Set Row number 
    newRow.querySelector('.row-number').innerText = totalRows + 1;
    document.querySelector('.mirror-rows').appendChild(newRow);
    totalRows++;
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

