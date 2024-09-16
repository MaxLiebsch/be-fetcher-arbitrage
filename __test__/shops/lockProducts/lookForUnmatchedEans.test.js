import { lookForUnmatchedEans } from "../../../src/db/util/lookForUnmatchedEans.js";

const lookfor = async() => { 

    const result = await lookForUnmatchedEans("1", 'mix','', 5);
    console.log('result:', result)
}

lookfor().then(() => {
    process.exit(0);
});