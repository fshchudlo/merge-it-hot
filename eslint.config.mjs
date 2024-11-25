import tseslint from "typescript-eslint";
import eslint from "@eslint/js";

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
    files: ["**/*.ts"],
    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "no-console": [0],
        strict: ["error", "global"],
    },
});
