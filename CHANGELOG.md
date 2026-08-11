# [1.0.0](https://github.com/juwel-development/LIB-design-system/compare/v0.2.0...v1.0.0) (2026-08-11)


* fix(button)!: drop elevation — shadows and the press-shift ([b9ec2a8](https://github.com/juwel-development/LIB-design-system/commit/b9ec2a8c3a7394a566cbf8508a180dbf63a2bdea)), closes [#1](https://github.com/juwel-development/LIB-design-system/issues/1)


### BREAKING CHANGES

* Button's `shadow` prop is removed. Its only value, `shadow="none"`, asked
for what is now the default, so delete the prop from any call site that sets it.

# [0.2.0](https://github.com/juwel-development/LIB-design-system/compare/v0.1.2...v0.2.0) (2026-08-09)


### Features

* **button:** support submit and reset button types ([e81f197](https://github.com/juwel-development/LIB-design-system/commit/e81f197d2a707666c6195e30c6850a0acf28453b))
