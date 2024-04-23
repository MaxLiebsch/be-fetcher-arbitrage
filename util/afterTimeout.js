const afterTimeout = (fn) => new Promise((res, rej)=>{

    setTimeout(()=> fn(), 35000)

})