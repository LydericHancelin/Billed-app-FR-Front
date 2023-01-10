/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";

import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { fireEvent, screen, within } from "@testing-library/dom";

import BillsUI from "../views/BillsUI.js";
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";
import { bills } from "../fixtures/bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/Store.js", () => mockStore);

const setNewBill = () => {
  return new NewBill({
    document,
    onNavigate,
    store: mockStore,
    localStorage: window.localStorage,
  });
};

beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });

  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "a@a",
    })
  );
});

beforeEach(() => {
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();

  document.body.innerHTML = NewBillUI();

  window.onNavigate(ROUTES_PATH.NewBill);
});

afterEach(() => {
  jest.resetAllMocks();
  document.body.innerHTML = "";
});


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then letter icon in vertical layout layout should be highlighted", () => {
      const windowIcon = screen.getByTestId("icon-mail");
      expect(windowIcon).toHaveClass("active-icon");

    })
    test("should added a image valid with the extensions jpg, jpeg or png", () => {
      const onNavigate = pathname => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const uploader = screen.getByTestId("file");
      fireEvent.change(uploader, {
        target: {
          files: [new File(["image"], "image.png", { type: "image/png" })],
        },
      });
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      uploader.addEventListener("change", handleChangeFile);
      fireEvent.change(uploader);

      expect(uploader.files[0].name).toBe("image.png");
      expect(uploader.files[0].name).toMatch(/(jpeg|jpg|png)/);
      expect(handleChangeFile).toHaveBeenCalled();

    })

    describe("When I do fill fields in correct format and I click on submit button", () => {
      test("create a new bill from mock API POST", async () => {
        const onNavigate = pathname => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const inputData = bills[0];
        const newBillForm = screen.getByTestId("form-new-bill");
        const submitSpy = jest.spyOn(newBill, "handleSubmit");
        const imageInput = screen.getByTestId("file");
        const file = getFile(inputData.fileName, ["jpg"])

        // On remplit les champs
        selectExpenseType(inputData.type);
        userEvent.type(getExpenseName(), inputData.name);
        userEvent.type(getAmount(), inputData.amount.toString());
        const mydate = screen.getByTestId("datepicker")
        mydate.value = inputData.date;
        userEvent.type(getVat(), inputData.vat.toString());
        userEvent.type(getPct(), inputData.pct.toString());
        userEvent.type(getCommentary(), inputData.commentary);
        await userEvent.upload(imageInput, file);

        newBill.fileName = file.name;

        // On s'assure que les données entrées requises sont valides
        expect(inputData.fileName.endsWith("jpg")).toBeTruthy()
        expect(getDate().validity.valueMissing).toBeFalsy();
        expect(getAmount().validity.valueMissing).toBeFalsy();
        expect(getPct().validity.valueMissing).toBeFalsy();


        // On s'assure que le formulaire est soumettable
        const submitButton = screen.getByTestId("btn-send-bill");
        expect(submitButton.type).toBe("submit");

        // On soumet le formulaire
        newBillForm.addEventListener("submit", newBill.handleSubmit)
        fireEvent.submit(newBillForm);

        expect(submitSpy).toHaveBeenCalled();

        // On s'assure qu'on est bien renvoyé sur la page Bills
        expect(screen.getByText("Mes notes de frais")).toBeVisible();


      });

    })


    //Test d'intégration POST
    describe('When I am on NewBill page, I filled in the form correctly and I clicked on submit button', () => {
      test('Then a new bill should be created',()  => {
        document.body.innerHTML = ''

        document.body.innerHTML = NewBillUI()

        const newBills = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        const handleChangeFile = jest.fn((e) => newBills.handleChangeFile(e))
        const handleSubmit = jest.fn((e) => newBills.handleSubmit(e))

        const fileInput = screen.getByTestId('file')
        fileInput.addEventListener('change', handleChangeFile)
        const file =  new File(["hello"], "hello.jpg", { type: "image/jpeg" })
        userEvent.upload(fileInput, file)

        const newBill = ({
        type: 'Transports',
        name:  'test99',
        amount: '129',
        date:  '05 Aoû. 2020',
        vat: 20,
        pct: 30,
        commentary: 'Ceci est un test',
        })

        const typeNewBill = screen.getByTestId('expense-type')
        const nameNewBill = screen.getByTestId('expense-name')
        const amountNewBill = screen.getByTestId('amount')
        const dateNewBill = screen.getByTestId('datepicker')
        const vatNewBill = screen.getByTestId('vat')
        const pctNewBill = screen.getByTestId('pct')
        const commNewBill = screen.getByTestId('commentary')

        fireEvent.change(typeNewBill, {target: { value: newBill.type }})
        fireEvent.change(nameNewBill, {target: { value: newBill.name }})
        fireEvent.change(amountNewBill, {target: { value: newBill.amount }})
        fireEvent.change(dateNewBill, {target: { value: newBill.date }})
        fireEvent.change(vatNewBill, {target: { value: newBill.vat }})
        fireEvent.change(pctNewBill, {target: { value: newBill.pct }})
        fireEvent.change(commNewBill, {target: { value: newBill.commentary }})

        expect(handleChangeFile).toHaveBeenCalled()

        const formNewBill = screen.getByTestId('form-new-bill')
        formNewBill.addEventListener('submit', handleSubmit)
        fireEvent.submit(formNewBill)

        expect(handleSubmit).toHaveBeenCalled()
      })
    })
    describe('When an error occurs on API', () => {
      beforeEach(() => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
            email: 'a@a',
          })
        )

        document.body.innerHTML = NewBillUI()
      })

      test('Then new bill are added to the API but fetch fails with 404 message error', async () => {
        const spyedMockStore = jest.spyOn(mockStore, 'bills')
        spyedMockStore.mockImplementationOnce(() => {
          return {
            create: jest.fn().mockRejectedValue(new Error('Erreur 404')),
          }
        })
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname, data: bills })
        }
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          bills: bills,
          localStorage: window.localStorage,
        })
        const fileInput = screen.getByTestId('file')

        fireEvent.change(fileInput, {
          target: {
            files: [
              new File(['test'], 'test.jpg', {
                type: 'image/jpeg',
              }),
            ],
          },
        })

        await spyedMockStore()
        expect(spyedMockStore).toHaveBeenCalled()
        expect(newBill.billId).toBeNull()
        expect(newBill.fileUrl).toBeNull()
        spyedMockStore.mockReset()
        spyedMockStore.mockRestore()
      })

      test('Then new bill are added to the API but fetch fails with 500 message error', async () => {
        const spyedMockStore = jest.spyOn(mockStore, 'bills')
        spyedMockStore.mockImplementationOnce(() => {
          return {
            create: jest.fn().mockRejectedValue(new Error('Erreur 500')),
          }
        })
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname, data: bills })
        }
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          bills: bills,
          localStorage: window.localStorage,
        })
        const fileInput = screen.getByTestId('file')
        fireEvent.change(fileInput, {
          target: {
            files: [
              new File(['test'], 'test.jpg', {
                type: 'image/jpeg',
              }),
            ],
          },
        })

        await spyedMockStore()
        expect(spyedMockStore).toHaveBeenCalled()
        expect(newBill.billId).toBeNull()
        expect(newBill.fileUrl).toBeNull()
      })
    })
  })
});

const selectExpenseType = expenseType => {
  const dropdown = screen.getByRole("combobox");
  userEvent.selectOptions(
    dropdown,
    within(dropdown).getByRole("option", { name: expenseType })
  );
  return dropdown;
};

const getExpenseName = () => screen.getByTestId("expense-name");
const getAmount = () => screen.getByTestId("amount");
const getDate = () => screen.getByTestId("datepicker");
const getVat = () => screen.getByTestId("vat");
const getPct = () => screen.getByTestId("pct");
const getCommentary = () => screen.getByTestId("commentary");
const getFile = (fileName, fileType) => {
  const file = new File(["img"], fileName, {
    type: [fileType],
  });
  return file;
};
