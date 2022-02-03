$(document).ready(function(){
    window._accs = null;
    window._old_data = null;
    window._search_by = 1; // default: name
    window._threshold = 2; // chars
    window._timing = 300; // ms
    window._timer = null;
    
    do_fetch({api_suffix: 'accounts_agregate', data: {}});
    do_fetch({api_suffix: 'accounts', data: {}});
        
    function do_fetch(opts) {
        // console.log(opts);
        $.ajax({ 
            type: 'GET', 
            url: `${get_api_base()}/${opts.api_suffix}`, 
            data: opts.data,
            beforeSend: get_before_send(),
            contentType: 'application/json',
            dataType: 'json',
            success: data => {
                if(!data.error){
                    console.log('data receive success!', data);
                    if(opts.api_suffix == 'accounts_agregate') {
                        $('#overall_debit').text(format_amount(data.overall_debit));
                        $('#overall_credit').text(format_amount(data.overall_credit));
                        $('#overall_balance').text(format_amount(data.overall_debit - data.overall_credit));
                        return;
                    }
                    window._accs = data.accounts;
                    if(opts.api_suffix == 'accounts') window._old_data = data.accs;
                    insert_accs(data.accounts);
                } else {
                    console.log('error:', data.error)
                }
                
            }
        });
    }

    function insert_accs(accs) {
        console.log('inserting:', accs);
        let accs_container = $('#all_accounts-container');
        accs_container.html('');
        let btn_onclick = e => {
            handle_e(e);
            localStorage.setItem('selected_acc_id', $(e.target).data('accID'));
            $(location).attr('href','/edit.html');
        };
        let acc_onclick = e => {
            handle_e(e);
            let t = $(e.target);
            let acc_id = t.is('div') ? t.data('accID') : t.parent().data('accID');
            localStorage.setItem('selected_acc_id', acc_id);
            $(location).attr('href','/view.html');
        };

        $.each(accs, (i, acc) => {
            
            let div = $("<div/>").attr('class','account');
            div.on('click', acc_onclick);
            let span = $("<span/>").attr('class','account_name').html('Name: ' + acc.name);   
            div.append(span);
            // span = $("<span/>").attr('class','acc_number').html('Acc No.: ' + acc.acc_id);   
            // div.append(span);
            let btn = $("<button/>").attr('class','btn btn-primary account_edit').html('Edit');
            btn.on('click', btn_onclick);
            btn.data('accID', acc.acc_id);
            div.append(btn)            
            div.data('accID', acc.acc_id);
            accs_container.append(div);
        });
    }

    $('#search_by').on('change', e => {
        window._search_by = +e.target.value;
    })

    function proceed_for_search(text) {
        if(text.length >= window._threshold) {
            //console.log('searching: ' + text);
            let opts = {api_suffix: 'accounts_by_name', data: {}};
            if(window._search_by == 1) {
                opts.data['name'] = text;
                do_fetch(opts);
            } else {
                opts.api_suffix = 'accounts_by_acc_id';
                opts.data['acc_id'] = text;
                do_fetch(opts);
            } 
        }
    }

    $('#search_box').on('keyup', e => {
        if(window._timer){
            //console.log('clearing timeout: ' + window._timer);
            clearTimeout(window._timer);
        }
        let text = $('#search_box').val();
        if(text.length >= window._threshold) {
            // set new timer
            window._timer = setTimeout(_ => {
                proceed_for_search(text);
            }, window._timing);
        } else {
            insert_accs(window._old_data);
        }
    })
})