$(document).ready(_ => {
    reset_vars(PAGE.VIEW);
    $.ajax({ 
        type: 'GET', 
        url: `${get_api_base()}/account_by_id`, 
        data: {acc_id: localStorage.getItem('selected_acc_id')},
        beforeSend: get_before_send(),
        contentType: 'application/json',
        dataType: 'json',
        success: data => {
            console.log('success');
            if(!data.error){
                console.log('data received');
                populate(data.account);
            } else {
                console.log('error:', data.error)
            }
            
        }
    });

    $('#print_acc').on('click', e => {
        handle_e(e);
        console.log('trying printing the acc...');
        print_the_acc();
    });
});

function get_row_item(tx, i) {
    // console.log('row', tx, i);
    let row = $('<tr>')
    row.attr('id', `tx_${i}`);
    
    let dated = $('<td>');
    dated.attr({
        'id': `dated_${i}`,
        'colspan': '1'
    });
    dated.html(format_date_local(tx.dated));
    
    let desc = $('<td>');
    desc.attr({
        'id': `desc_${i}`,
        'colspan': '4'
    });
    desc.html(tx.description);
    
    let credit = $('<td>');
    credit.attr({
        'id': `credit_${i}`,
        'colspan': '1'
    });
    credit.html(format_amount(tx.credit));
    
    let debit = $('<td>');
    debit.attr({
        'id': `debit_${i}`,
        'colspan': '2'
    });
    debit.html(format_amount(tx.debit));
    
    let balance = $('<td>');
    balance.attr({
        'id': `balance_${i}`,
        'colspan': '3'
    });
    balance.html(format_amount(tx.balance));

    row.append(dated);
    row.append(desc);
    row.append(credit);
    row.append(debit);
    row.append(balance);

    return row;
}

function populate(acc) {
    $('#name').html(acc.name);
    $('#total_credit').html(format_amount(acc.credit_total));
    $('#total_debit').html(format_amount(acc.debit_total));
    $('#total_balance').html(format_amount(acc.balance_total));
    $('#address').html(acc.address);
    $('#acc_number').html(acc.acc_id);
    let container = $('#account_items_container');
    for(let i=acc.txs.length-1; i>-1; --i) container.prepend(get_row_item(acc.txs[i], i+1))
}

function get_print_font() {
    original_font_size = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
    return {
        size: original_font_size + (original_font_size * print_font_inc),
        family: '',
    }
}

function set_print_format() {
    let font = get_print_font();
    
    $('html').css('font-size', `${font.size}px`);
    $('.no-print--content').each((_, elm) => $(elm).addClass('no-print--style'));
    $('.no-print--border').each((_, elm) => $(elm).addClass('no--border'));
}

function reset_print_format() {
    $('html').css('font-size', `${original_font_size}px`);
    $('.no-print--content').each((_, elm) => $(elm).removeClass('no-print--style'));
    $('.no-print--border').each((_, elm) => $(elm).removeClass('no--border'));
}

function print_the_acc() { 
    set_print_format();
    window.print();
    reset_print_format()
}