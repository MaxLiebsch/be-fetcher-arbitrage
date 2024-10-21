import {get} from "underscore"


console.log(get({
    brand: { key: '', value: '' },
    year: { min: 0, max: 0 },
    model: { key: '', value: '' },
    category: '',
    product: { value: 'B091J3NYVF', key: 'B091J3NYVF', price: 250 }    
  }, ['product', 'value'], 'blub'));