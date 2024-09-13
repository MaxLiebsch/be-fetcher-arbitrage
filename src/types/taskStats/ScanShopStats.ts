import { BaseStats } from "./TasksStats"

export interface ScanShopStats extends BaseStats {
    new: number
    old: number
    categoriesHeuristic: CategoriesHeuristic
    productPageCountHeuristic: ProductPageCountHeuristic
    missingProperties: MissingProperties
  }
  
  export interface CategoriesHeuristic {
    subCategories: SubCategories
    mainCategories: number
  }
  
  export interface SubCategories {
    "0": number
    "1-9": number
    "10-19": number
    "20-29": number
    "30-39": number
    "40-49": number
    "+50": number
  }
  
  export interface ProductPageCountHeuristic {
    "0": number
    "1-9": number
    "10-49": number
    "+50": number
  }
  
  export interface MissingProperties {
    name: number
    price: number
    link: number
    image: number
  }
  