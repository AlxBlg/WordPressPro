document.addEventListener('DOMContentLoaded', function() {
    const windowsContainer = document.getElementById('windowsContainer');
    const addWindowBtn = document.getElementById('addWindowBtn');
    const savePdfBtn = document.getElementById('savePdfBtn');
    const summaryTable = document.getElementById('summaryTable');

    const descriptions = {
        'simple': 'Глухое окно - пленка с окантовкой и люверсами диаметром 10 миллиметров по периметру через 35 сантиметров',
        'rotating': 'С поворотными скобами - возможность частичного открывания',
        'zipper': 'На молниях - полностью открывающаяся конструкция'
    };

    function initializeWindowForm(form) {
        const windowType = form.querySelector('.window-type');
        const typeDescription = form.querySelector('.type-description');

        windowType.addEventListener('change', function() {
            typeDescription.textContent = descriptions[this.value];
        });

        typeDescription.textContent = descriptions[windowType.value];

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Recalculate all windows when any calculation button is pressed
            document.querySelectorAll('.calculator-form').forEach(form => {
                calculatePrice(form);
            });
            updateSummaryTable();
        });
    }

    function calculatePrice(form) {
        const height = parseFloat(form.querySelector('.height').value);
        const width = parseFloat(form.querySelector('.width').value);
        const type = form.querySelector('.window-type').value;
        const bottomFurniture = form.querySelector('.bottom-furniture').checked;

        if (!height || !width || height <= 0 || width <= 0) {
            alert('Пожалуйста, введите корректные размеры');
            return;
        }

        const area = height * width;
        let basePrice = area * 1400; // Changed to 1400 rubles per square meter
        let additionalCosts = 0;
        let additionalDetails = [];

        switch(type) {
            case 'rotating':
                // Formula: (height / 0.4) rounded * 2 * 230
                const bracketsCount = Math.round(height / 0.4) * 2;
                additionalCosts += bracketsCount * 230;
                additionalDetails.push(`Поворотные скобы (${bracketsCount} шт.): ${bracketsCount * 230} руб.`);
                break;
            case 'zipper':
                // Formula: height * 2 * 750
                const zipperCost = height * 2 * 750;
                additionalCosts += zipperCost;
                additionalDetails.push(`Молнии (${(height * 2).toFixed(1)} м): ${zipperCost.toFixed(0)} руб.`);
                break;
        }

        if (bottomFurniture) {
            // Formula: (width / 0.4) rounded up - 1, multiplied by price per bracket
            const bottomBracketsCount = Math.ceil(width / 0.4) - 1;
            const bottomCost = bottomBracketsCount * 230;
            additionalCosts += bottomCost;
            additionalDetails.push(`Фурнитура по низу (${bottomBracketsCount} шт.): ${bottomCost} руб.`);
        }

        const results = form.querySelector('.results');
        results.style.display = 'block';
        results.querySelector('.area').textContent = area.toFixed(2);
        results.querySelector('.base-price').textContent = basePrice.toFixed(0);
        results.querySelector('.additional-costs').innerHTML = additionalDetails.length > 0 ? 
            'Дополнительные расходы:<br>' + additionalDetails.join('<br>') : '';
        results.querySelector('.total-price').textContent = (basePrice + additionalCosts).toFixed(0);
    }

    function updateSummaryTable() {
        const forms = document.querySelectorAll('.calculator-form');
        const tbody = document.getElementById('summaryTableBody');
        let totalSum = 0;

        tbody.innerHTML = '';
        forms.forEach(form => {
            const results = form.querySelector('.results');
            if (results.style.display !== 'none') {
                const row = document.createElement('tr');
                const name = form.querySelector('.window-name').value;
                const height = form.querySelector('.height').value;
                const width = form.querySelector('.width').value;
                const type = form.querySelector('.window-type').options[form.querySelector('.window-type').selectedIndex].text;
                const hasBottomFurniture = form.querySelector('.bottom-furniture').checked;
                const total = parseFloat(results.querySelector('.total-price').textContent);

                row.innerHTML = `
                    <td>${name}</td>
                    <td>${height}x${width} м</td>
                    <td>${type}</td>
                    <td>${hasBottomFurniture ? 'С фурнитурой по низу' : 'Стандартная'}</td>
                    <td>${total.toFixed(0)} руб.</td>
                `;
                tbody.appendChild(row);
                totalSum += total;
            }
        });

        document.getElementById('totalOrderSum').innerHTML = `<strong>${totalSum.toFixed(0)}</strong> руб.`;
        summaryTable.style.display = tbody.children.length > 0 ? 'block' : 'none';
    }

    addWindowBtn.addEventListener('click', function() {
        const template = windowsContainer.children[0].cloneNode(true);
        const form = template.querySelector('form');
        form.reset();
        form.querySelector('.results').style.display = 'none';
        form.querySelector('.window-name').value = 'Наименование изделия';
        windowsContainer.appendChild(template);
        initializeWindowForm(form);
    });

    savePdfBtn.addEventListener('click', function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');

        // Generate WhatsApp QR code
        const phoneNumber = "79143880023";
        const whatsappUrl = `https://wa.me/${phoneNumber}`;
        const qr = qrcode(0, 'M');
        qr.addData(whatsappUrl);
        qr.make();
        const qrImage = qr.createDataURL();

        // Add QR code
        doc.addImage(qrImage, 'PNG', 200, 20, 30, 30);

        // Load and add DejaVuSans font
        doc.addFileToVFS("DejaVuSans.ttf", DejaVuSans); // DejaVuSans из DejaVuSans-normal.js
        doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
        doc.setFont("DejaVuSans");

        // Header
        doc.setFontSize(16);
        doc.text('МЯГКИЕ ОКНА ДВ', 20, 20);
        doc.setFontSize(12);
        doc.text('oknadv.com | brezent.online', 20, 30);
        doc.text('Тел.: +7 914 388 0023; 552-448', 20, 40);
        doc.text('Производство мягких окон, тентов и пологов в Благовещенске с 2019 года.', 20, 50);
        doc.text('Изготовление по размерам заказчика. При оформлении заказа выезд на замеры - бесплатный.', 20, 60);

        // Table with calculations
        const tableColumns = ['Наименование', 'Размеры', 'Тип конструкции', 'Комплектация', 'Стоимость'];
        const tableRows = Array.from(document.getElementById('summaryTableBody').children).map(row => {
            return Array.from(row.children).map(cell => cell.textContent);
        });

        doc.autoTable({
            head: [tableColumns],
            body: tableRows,
            startY: 70,
            theme: 'grid',
            styles: {
                font: 'DejaVuSans',
                fontSize: 10
            }
        });

        // Additional information after the table
        const finalY = doc.previousAutoTable.finalY + 10;
        doc.text('Расчет предварительный при условиях установки фурнитуры через 40 см.', 20, finalY);
        doc.text('Для окончательного расчета звоните нам, мы поможем выбрать оптимальный вариант для Вашей беседки.', 20, finalY + 10);

        // Large company name
        doc.setFontSize(36);
        doc.text('МЯГКИЕ ОКНА ДВ', 20, finalY + 30);
        doc.setFontSize(24);
        doc.text('Мы создаем уют', 20, finalY + 40);

        doc.save('расчет-мягких-окон.pdf');
    });

    // Initialize first form
    initializeWindowForm(document.querySelector('.calculator-form'));
});