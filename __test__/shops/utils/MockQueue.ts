export class MockQueue {
    queue: string[] = [];
    constructor() {}
  
    public addCategoryLink(link: string) {
      this.queue.push(link);
    }
  
    public doesCategoryLinkExist(link: string) {
      return false;
    }
  }