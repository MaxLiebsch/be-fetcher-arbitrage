import UpcomingRequestCache from "../../src/util/UpcomingRequestCache.js";

function main (){
    const cache = new UpcomingRequestCache();

cache.set('idealo.de', 'host1');
cache.set('idealo.de', 'host1');
cache.set('reichelt.de', 'host2');
console.log(cache.getAllEntries()); // []

console.log(cache.get('idealo.de')); // 'value1'
console.log(cache.get('idealo.de')); // 'value2'
console.log(cache.get('idealo.de')); // null
console.log(cache.get('reichelt.de')); // 'value3'
console.log(cache.get('reichelt.de')); // null

console.log(cache.getAllEntries()); // []
}

main();