import { expect, test } from "bun:test"

test("hardware visibility declares the catalogue it imports at runtime", async () => {
  const manifest = await Bun.file(
    new URL("../package.json", import.meta.url),
  ).json()

  expect(manifest.dependencies).toHaveProperty(
    "@tscircuit/jscad-assembly-hardware",
  )
})
