function normalize(rows, acols, tcols) {
    console.log('rows', rows);
    let res = {
        txs: []
    }
    
    tcols.push('tx_id');
    acols.push('acc_id');

    acols.forEach(ac => res[ac] = rows[0][ac]);
    rows.forEach(row => {
        let tx = {};
        tcols.forEach(tc => tx[tc] = row[tc]);
        res.txs.push(tx);
    });
    return res;
}

module.exports = {
    normalize,
}