/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";

import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { fireEvent, screen, within } from "@testing-library/dom";

import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";
import { bills } from "../fixtures/bills.js";
import { get } from "jquery";
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
    describe("When I do fill fields in correct format and I click on submit button", () => {
      test("Then the submission process should work properly, and I should be sent on the Bills Page", async () => {
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

        const file = getFile(inputData.fileName, ["image/jpg"])

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

        // On s'assure que les données entrées requises sont valides
        expect(
          selectExpenseType(inputData.type).validity.valueMissing
        ).toBeFalsy();
        expect(getDate().validity.valueMissing).toBeFalsy();
        expect(getAmount().validity.valueMissing).toBeFalsy();
        expect(getPct().validity.valueMissing).toBeFalsy();

        newBill.fileName = file.name;

        // On s'assure que le formulaire est soumettable
        const submitButton = screen.getByTestId("btn-submit" );
        expect(submitButton.type).toBe("submit");

        // On soumet le formulaire
        newBillForm.addEventListener("submit", newBill.handleSubmit)
        fireEvent.submit(newBillForm);

        expect(submitSpy).toHaveBeenCalled();

        // On s'assure qu'on est bien renvoyé sur la page Bills
        expect(screen.getByText("Mes notes de frais")).toBeVisible();
      });

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
