import { getSettingsCol} from "../src/db/mongo.js";

describe('config', ()=> {
    it('should get config', async ()=> {
        const settings = await getSettingsCol();
        expect(settings).toBeDefined();
    })

    it('should get config/allowed-domains', async ()=> {
        const settings = await getSettingsCol();
        const allowedDomains = await settings.findOne({name: 'allowed-domains'});
        expect(allowedDomains).not.toBeNull();
    })
})
