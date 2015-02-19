"use strict"

import {foo} from "../src/foo"
import expect from "expect"

describe("base", () => {
  it("should return 42", () => {
    expect(foo()).toEqual(42)
  })
})
