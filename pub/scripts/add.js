$(document).ready(_ => {
    reset_vars(PAGE.ADD);
    $('#upload_acc').on('click', e => {
        console.log('uploading from add page');
        try_uploading('add_account', {}); 
     });
    
})