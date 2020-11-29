---
title: Terraform 사용법
date: 2020-10-01 01:10:04
category: aws
thumbnail: { thumbnailSrc }
draft: true
---

```shell
mkdir terraform
cd terraform
```

01_provider.tf
```
provider "aws" {
  region = var.region
}

# core

variable "region" {
  description = "The AWS region to create resources in."
  default     = "ap-northeast-2"
}
```

