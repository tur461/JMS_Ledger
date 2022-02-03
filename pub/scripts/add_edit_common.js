$(document).ready(function() {

    $('#add_row-item').on('click', add_row);
    
    $('input').on('focus', remove_err);

    $('#credit_0').on('keyup', change_balance);
    $('#debit_0').on('keyup', change_balance);

    $('#total_debit').on('keyup', change_total_credit);
    $('#total_credit').on('keyup', change_total_debit);

    $('#clear_acc').on('click', e => {
        $('input').each((_, el) => $(el).val(''));
    })    
});

const PAGE = { EDIT: 1, ADD: 2, VIEW: 3, };
let row_ctr = 0;
let removed = [];
let rem_tx_ids = [];
let err = { ids: []};
let page = -1;
let original_font_size = 0.0;
let print_font_inc = 0.25;
let first_row = 0;

function reset_vars(pg) {
    row_ctr = 0;
    removed = [];
    rem_item_ids = [];
    err = {ids:[]};
    page = pg;
}

function is_edit_page() { 
    return page === PAGE.EDIT;
}

function is_add_page() { 
    return page === PAGE.ADD;
}

function add_row(e) { 
    e && handle_e(e);
    let node = process_node($('#item-row_0').clone());
    if(row_ctr > 0 && $('#item-headings').hasClass('d-none')) 
        $('#item-headings').removeClass('d-none');
    $('#item-rows_container').append(node);
    if(no_row_yet()){
        first_row = row_ctr;
        console.log('first row: ' + first_row);
        $(`#credit_${first_row}`).attr('disabled', true);
    }
}

function no_row_yet(){
    return row_ctr-1 === removed.length;
}

function process_node(node) {
    ++row_ctr;
    node.children().each((_, elm) => {
        $(elm).children().each((_, el) => {
            el = $(el);
            if(el.is('label')) el.remove();//el.attr('for', `${el.text()}_${row_ctr}`);
            if(el.is('input')) {
                el.attr({
                    'id': `${el.attr('id').split('_')[0]}_${row_ctr}`,
                    'name': `${el.attr('name').split('_')[0]}_${row_ctr}`,
                })
                el.val('');
                if(el.attr('id').indexOf('debit')!=-1)
                    el.on('keyup', change_total_debit);
                if(el.attr('id').indexOf('credit')!=-1)
                    el.on('keyup', change_total_credit);
                if(el.attr('id').indexOf('balance')!=-1)
                    el.attr('disabled', true);
                el.on('focus', remove_err);
                el.removeClass('is-invalid');
            }
            if(el.is('button')) {
                el.attr({
                    'disabled': false,
                    'id': `remove-item_${row_ctr}`
                });
                el.on('click', remove_item);
            }
        })
    });
    node.attr('id', `item-row_${row_ctr}`);
    node.removeClass('d-none');
    return node;
}

function remove_item(e) {
    handle_e(e);
    let i = $(e.target).attr('id').split('_')[1];
    removed.push(+i);
    
    if(is_edit_page()) rem_item_ids.push(get_item_id(i));

    $(`#item-row_${i}`).remove();
    if(removed.length == row_ctr) $('#item-headings').addClass('d-none');
    change_total_debit();
    change_total_credit();
    //console.log('item_ids removed:', rem_item_ids);
}

function get_tx_id(i) {
    let id  = $(`#item-row_${i}`).data('txID');
    return id === undefined ? 0 : id;
}

function get_total(what) {
    let tmp = 0.0;
    for(let i=0; i<=row_ctr; ++i)
        tmp += removed.indexOf(i) === -1 ? +$(`#${what}_${i}`).val() : 0.0;
    return tmp
}

function exists(i) {
    return removed.indexOf(i) === -1;
}

function change_total_credit(e) {
    e && handle_e(e);
    let tcred = get_total('credit');
    $('#total_credit').val(tcred);
    change_balance();
}

function change_total_debit(e) {
    e && handle_e(e);
    let tdebt = get_total('debit');
    $('#total_debit').val(tdebt);
    change_balance();
}

function change_balance() {
    for(let i=0, d=0.0, c=0.0, p=first_row, pb=0.0, bal=0.0; i<=row_ctr; ++i) {
        if(exists(i)) {
            d = +$(`#debit_${i}`).val();
            c = +$(`#credit_${i}`).val();
            pb = +$(`#balance_${p}`).val();
            bal = first_row == i ? d : pb - c + d;
            $(`#balance_${i}`).val(bal);
            p = i;
        }
    }
}

function try_get_acc_data() {
    err.ids = [];
    let acc_num = $('#acc_number');
    let sec_1 = {
        acc_id: acc_num ? +acc_num.val() : 0,
        name: $('#name').val(),
        phone: $('#phone').val(),
        address: $('#address').val()
    };

    if(!validate.name(sec_1.name))
        err.ids.push({
            id: `name`,
            message: 'name not valid',
        });

    if(!validate.phone(sec_1.phone))
        err.ids.push({
            id: `phone`,
            message: 'phone not valid',
        });

    if(!validate.address(sec_1.address))
        err.ids.push({
            id: `address`,
            message: 'address not valid',
        });

    let sec_3 = {
        credit_total: +$('#total_credit').val(),
        debit_total: +$('#total_debit').val(),
    };

    sec_3['balance_total'] = sec_3.debit_total - sec_3.credit_total;

    let xtra = {
        added_by: localStorage.getItem('mail_id') || '',
        acc_id: is_edit_page() ? localStorage.getItem('selected_acc_id') : '',
    }

    let sec_2 = { txs: [] };

    for(let i=1; i<=row_ctr; ++i) {
        if(exists(i)) {
            let desc = $(`#desc_${i}`).val();
            // skip if indexing is not contigous! (if desc elem !exists!)
            if(desc === undefined) continue;
            if(!validate.desc(desc)) {
                err.ids.push({
                    id: `desc_${i}`,
                    message: 'description not valid',
                });
            }
            sec_2.txs.push({
                description: desc,
                credit: $(`#credit_${i}`).val(),
                debit: $(`#debit_${i}`).val(),
                balance: $(`#balance_${i}`).val(),
                dated: new Date($(`#dated_${i}`).val()).getTime(),
                priority: i,
                tx_id: get_tx_id(i),
            });
        }
    }

    return {
        ...xtra,
        ...sec_1, 
        ...sec_2,
        ...sec_3, 
    }

}

function show_errs() {
    let errlist = $('#error_list');
    errlist.html('');
    err.ids.forEach(obj => {
        $(`#${obj.id}`).addClass('is-invalid');
        let li = $(`<li>${obj.message}</li>`);
        li.attr('id', `li_${obj.id}`);
        errlist.append(li);
    });
    errlist.removeClass('d-none');
}

function rem_from_errs(id) {
    update_err_list(id);
    err.ids = err.ids.filter(obj => obj.id !== id);
}

function remove_err(e) {
    handle_e(e);
    let target = $(e.target);
    target.removeClass('is-invalid');
    rem_from_errs(target.attr('id'));
}

function update_err_list(id) {
    let errlist = $('#error_list'), f=[];
    errlist.children().each((_, el) => {
        el = $(el);
        el.attr('id').includes(id) && el.remove();
    });
}

function try_uploading(api_fix, xtra_data) {
    let data = try_get_acc_data();
    //console.log('original data:', {...data});
    if(err.ids.length) {
        console.log('Error?:', {...err});
        show_errs();
        return;
    }
    if(is_edit_page()) {
        data['new_inserts'] = data.txs.filter(tx => tx.tx_id === 0);
        data.txs = data.txs.filter(tx => tx.tx_id !== 0);
        data.acc_id = localStorage.getItem('selected_acc_id');
    }
    console.log('uploading... Data:', data);
    $.ajax({ 
        type: 'POST', 
        url: `${get_api_base()}/${api_fix}`, 
        data: JSON.stringify({...data, ...xtra_data}),
        beforeSend: get_before_send(),
        contentType: 'application/json',
        dataType: 'json',
        success: data => {
            console.log('success');
            if(!data.error){
                toastr.success(data.message);
                console.log('data received');
            } else {
                toastr.error(data.error);
                console.log('error:', data.error)
            }
            
        },
        error: (j, e) => {
            if(j.status == 403) {
                toastr.warning('please logout and then login again!');
            }
        }
    });
}
