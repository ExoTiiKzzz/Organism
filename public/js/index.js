$(document).ready(() => {
    document.querySelectorAll('table').forEach(table => {
        //check if table has data
        let ths = table.querySelectorAll('th');
        ths.forEach(th => {
           if (th.textContent === 'Actions') th.classList.add('no-export');
        });
        //check if table has id
        if (!table.hasAttribute('id')) {
            table.setAttribute('id', 'table-' + Math.random().toString(36).substr(2, 9));
        }
        $(`#${table.getAttribute('id')}`).DataTable({
            dom: 'lBftrip',
            buttons: [
                {
                    extend: 'copyHtml5',
                    text: 'Copy',
                    exportOptions: {
                        columns: ':not(.no-export)'
                    }
                },
                {
                    extend: 'excelHtml5',
                    text: 'Excel',
                    exportOptions: {
                        columns: ':not(.no-export)'
                    }
                },
                {
                    extend: 'csvHtml5',
                    text: 'CSV',
                    exportOptions: {
                        columns: ':not(.no-export)'
                    }
                },
                {
                    extend: 'pdfHtml5',
                    text: 'PDF',
                    exportOptions: {
                        columns: ':not(.no-export)'
                    }
                }
            ]
        });
    });
})
