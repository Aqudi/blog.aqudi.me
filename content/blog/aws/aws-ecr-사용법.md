---
title: AWS-ECR-사용법
date: 2020-10-01 01:10:94
category: AWS
thumbnail: { thumbnailSrc }
draft: true
---

Account ID를 가져오는 API
```shell
$(aws sts get-caller-identity --query Account --output text)
```

AWS CLI2 에서 ECR 로그인하기
```shell
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.ap-northeast-2.amazonaws.com"
```
