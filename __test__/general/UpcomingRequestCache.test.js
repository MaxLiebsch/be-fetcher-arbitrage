import UpcomingRequestCachev2 from "../../src/util/UpcomingRequestCachev2.js";

function main (){
    const cache = new UpcomingRequestCachev2();

cache.setProxy('idealo.de', 'host1');
cache.setProxy('idealo.de', 'host1');
cache.setProxy('reichelt.de', 'host2');
console.log(cache.getAllEntries()); // []

console.log(cache.getRequestId('idealo.de')); // 'value1'
console.log(cache.getRequestId('idealo.de')); // 'value2'
console.log(cache.getRequestId('idealo.de')); // null
console.log(cache.getRequestId('reichelt.de')); // 'value3'
console.log(cache.getRequestId('reichelt.de')); // null

console.log(cache.getAllEntries()); // []
}

main();