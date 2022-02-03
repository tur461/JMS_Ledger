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
            
        },
        error: (j, e) => {
            if(j.status == 403) {
                toastr.error('UnAuthorised Access!. please login again!');
            }
        }
    });

    $('#upload_acc').on('click', e => {
        console.log('uploading from edit page');
        try_uploading('update_account_by_id', {removed_tx_ids: rem_tx_ids}); 
    });

    $('#confirm_delete').click(e => {
        handle_e(e);
        console.log('deleting...')
        mscConfirm({
            title: 'Delete', 
            subtitle: 'Are you sure you want to delete this account?',
            okText: 'Yes',
            cancelText: 'No',
            onOk: _ => {
                toastr.info('Sending Delete request...');
                setTimeout(trigger_delete_account, 2000);
            }, 
            onCancel: _ => {
                toastr.info('Deletion Cancelled!');
            } 
        });
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

function trigger_delete_account() {
    $.ajax({ 
        type: 'GET', 
        url: `${get_api_base()}/delete_account_by_id`, 
        data: {acc_id: localStorage.getItem('selected_acc_id')},
        beforeSend: get_before_send(),
        contentType: 'application/json',
        dataType: 'json',
        success: data => {
            console.log('success');
            if(!data.error){
                toastr.error('Account Deleted!');
            } else {
                toastr.error('Error deleting the account. please try agian!');
                console.log('error:', data.error)
            }
            
        },
        error: (j, e) => {
            if(j.status == 403) {
                toastr.error('UnAuthorised Access!. please login again!');
            }
            toastr.error('Error deleting the account. please try agian!');
        }
    });
}