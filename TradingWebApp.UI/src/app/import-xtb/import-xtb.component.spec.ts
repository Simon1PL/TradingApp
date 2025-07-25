// ng test --browsers=ChromeHeadless --watch=false
// use Jest instead of Jasmine + Karma???
import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MyBackendService } from '../services/my-backend.service';
import { ImportXTBComponent } from './import-xtb.component';

describe('ImportXTBComponent (integration)', () => {
  let importXTBComponent: ImportXTBComponent;
  let myBackendService: MyBackendService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [MyBackendService]
    });

    myBackendService = TestBed.inject(MyBackendService);
    importXTBComponent = new ImportXTBComponent(undefined as any, myBackendService);
  });

  it('test leverage table from backend', async () => {
    const table = await myBackendService.getXTBLeverageTable();
    expect(Array.isArray(table)).toBeTrue();

    (importXTBComponent as any).leverageTable = table;
    expect(await (importXTBComponent as any).getLeverageForSymbol('BITCOIN')).toBe(2);
    expect(await (importXTBComponent as any).getLeverageForSymbol('INPST.NL')).toBe(100 / 35);
  });
});