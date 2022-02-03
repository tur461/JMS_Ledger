const { start_server } = require('./server');
const cluster = require('cluster');
let num_of_cores = require('os').cpus().length;

if(cluster.isMaster) {
    console.log('# of cores: ' + num_of_cores);
    console.log('parent is running with pid: ' + process.pid);

    while(num_of_cores--) cluster.fork();

    cluster.on('exit', (child, code, sig) => {
        console.log('child is dead with pid: ' + process.pid);
        cluster.fork();    
    });

} else {
    console.log('a new child forked with pid: ' + process.pid);
    start_server();
}