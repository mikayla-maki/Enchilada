import { EnchiladaPage } from './app.po';

describe('enchilada App', () => {
  let page: EnchiladaPage;

  beforeEach(() => {
    page = new EnchiladaPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
