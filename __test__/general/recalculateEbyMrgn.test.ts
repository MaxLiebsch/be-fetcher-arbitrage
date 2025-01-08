import { recalculateEbyMargin } from '../../src/util/recalculateEbyMargin.js';
import {
  DbProductRecord,
} from '@dipmaxtech/clr-pkg';

describe('recalculateEbyMargin', () => {
  let productRecord: any;
  let spotterSet: Partial<DbProductRecord>;

  beforeEach(() => {
    productRecord = {
      lnk: 'https://www.idealo.de/preisvergleich/OffersOfProduct/4882255_-tafelschokolade-mandel-milch-nuss-100g-merci.html',
      createdAt: '2024-08-06T08:15:47.959Z',
      ctgry: ['Essen & Trinken', 'Schokolade'],
      eanList: ['4014400914252'],
      img: 'https://cdn.idealo.com/folder/Product/4882/2/4882255/s1_produktbild_gross/merci-tafelschokolade-mandel-milch-nuss-100g.jpg',
      mnfctr: 'Merci',
      nm: 'Tafelschokolade Mandel-Milch-Nuss (100g)',
      prc: 1.49,
      qty: 1,
      s_hash: 'cf23bbfb6133493b75d7b92282311ea0',
      updatedAt: '2025-01-08T14:53:03.124Z',
      uprc: 1.49,
      eanUpdatedAt: '2024-08-14T14:28:48.167Z',
      ean_prop: 'found',
      sku: '4014400914252',
      cur: 'EUR',
      hasMnfctr: false,
      sdmn: 'idealo.de',
      gl: 'gl_grocery',
      a: 'sofort lieferbar',
      availUpdatedAt: '2025-01-08T14:49:50.629Z',
      e_img:
        'https://i.ebayimg.com/thumbs/images/g/dhAAAOSwYVlkDvJv/s-l500.jpg',
      e_nm: 'Storck merci Mandel Milch Nuss einzeln verpackte Tafeln 100g',
      e_orgn: 'e',
      e_pRange: {
        min: 1.9,
        max: 39.99,
        median: 20.945,
      },
      e_pblsh: true,
      e_prc: 1.9,
      e_qty: 1,
      e_totalOfferCount: 2,
      e_uprc: 1.9,
      eby_prop: 'complete',
      esin: '125818607468',
      qEbyUpdatedAt: '2024-12-01T12:42:42.951Z',
      catUpdatedAt: '2024-12-01T12:44:42.734Z',
      cat_prop: 'complete',
      e_costs: 0.21,
      e_cur: 'EUR',
      e_mrgn: 0.14,
      e_mrgn_pct: 7.37,
      e_ns_costs: 0.21,
      e_ns_mrgn: 0.14,
      e_ns_mrgn_pct: 7.37,
      e_tax: 0.3,
      e_vrfd: {
        vrfd: false,
        vrfn_pending: true,
        flags: [],
        flag_cnt: 0,
        nm_prop: 'complete',
        score: 0.85,
        isMatch: true,
        qty_prop: 'complete',
        qty_score: 0.9,
      },
      ebyCategories: [
        {
          id: 14308,
          createdAt: '2024-12-01T12:44:42.734Z',
          category: 'Feinschmecker',
        },
      ],
      ebyUpdatedAt: '2025-01-08T14:53:03.124Z',
      dealEbyUpdatedAt: '2025-01-07T20:28:37.834Z',
      nm_v: 'v01',
      nm_updatedAt: '2024-12-01T21:42:01.162Z',
      a_img: 'https://m.media-amazon.com/images/I/41c8PpCYbrL._SL120_.jpg',
      a_nm: '15 Tafeln a 100g Merci Mandel Milch Nuss Schokolade Storck',
      a_orgn: 'a',
      a_pblsh: false,
      a_qty: 15,
      a_rating: 5,
      a_reviewcnt: 2,
      a_vrfd: {
        vrfd: false,
        vrfn_pending: true,
        flags: [],
        flag_cnt: 0,
        qty_prop: 'complete',
        qty_score: 0.9,
      },
      asin: 'B07D5DLH81',
      aznUpdatedAt: '2024-12-28T09:18:18.471Z',
      bsr: [
        {
          category: 'Lebensmittel & Getränke',
          number: 187008,
          createdAt: '2024-12-30T09:28:36.290Z',
        },
      ],
      infoUpdatedAt: '2024-12-30T09:28:36.290Z',
      info_prop: 'no_offer',
      totalOfferCount: 4,
      a_mrgn: -23.88,
      a_mrgn_pct: -2388,
      a_p_mrgn: -24.13,
      a_p_mrgn_pct: -2413,
      a_p_w_mrgn: -24.13,
      a_p_w_mrgn_pct: -2413,
      a_prc: 1,
      a_uprc: 0.07,
      a_useCurrPrice: true,
      a_w_mrgn: -23.88,
      a_w_mrgn_pct: -2388,
      costs: {
        tpt: 4.95,
        varc: 0,
        azn: 0.99,
        strg_1_hy: 0,
        strg_2_hy: 0,
        estmtd: false,
        dfltTpt: true,
        noStrgFee: true,
      },
      qty_v: 'v05',
      nm_vrfd: {
        qty_prop: 'complete',
        qty_score: 0.9,
      },
      qty_updatedAt: '2025-01-05T11:26:01.354Z',
    } 

    spotterSet = {};
  });

  it('should map category and set ebyCategories in spotterSet', () => {
      recalculateEbyMargin(productRecord, spotterSet);

      console.log('spotterSet:', spotterSet)
      expect(spotterSet.e_costs).toBe(2.30395)
  });
});
