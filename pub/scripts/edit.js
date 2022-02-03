$(document).ready(_ => {
    reset_vars(PAGE.EDIT);
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

    $('#upload_acc').on('click', e => {
        console.log('uploading from edit page');
        try_uploading('update_account_by_id', {removed_tx_ids: rem_tx_ids}); 
    });

});

function populate(acc) {
    console.log('populate', acc);
    $('#name').val(acc.name);
    $('#phone').val(acc.phone);
    $('#address').val(acc.address);
    $('#total_credit').val(acc.credit_total);
    $('#total_debit').val(acc.debit_total);
    $('#total_balance').val(acc.balance_total);
    
    acc.txs.forEach((tx, i) => {
        add_row();
        $(`#dated_${i+1}`).val(format_date(tx.dated));
        $(`#dated_${i+1}`).attr('disabled', true);
        $(`#desc_${i+1}`).val(tx.description);
        $(`#desc_${i+1}`).attr('disabled', true);
        $(`#credit_${i+1}`).val(tx.credit);
        $(`#credit_${i+1}`).attr('disabled', true);
        $(`#debit_${i+1}`).val(tx.debit);
        $(`#debit_${i+1}`).attr('disabled', true);
        $(`#balance_${i+1}`).val(tx.balance);
        $(`#balance_${i+1}`).attr('disabled', true);

        $(`#item-row_${i+1}`).data('txID', tx.tx_id);
        $(`#item-row_${i+1} button.remove_item`).remove();
        
    });
}