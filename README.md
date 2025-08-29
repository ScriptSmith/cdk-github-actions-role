# CDK Github Actions Role

This CDK Construct Library project provides a construct (`CdkGithubActionsRole`) that creates an IAM role with permissions to perform GitHub Actions tasks.

## Usage

CDK stack generating the Role:

```typescript
import * as cdk from "aws-cdk-lib";
import { CdkGithubActionsRole } from "@scriptsmith/cdk-github-actions-role";

const stack = new cdk.Stack();

const githubRole = new CdkGithubActionsRole(stack, "MyTestConstruct", {
  owner: "my-owner",
  repository: "my-repo",
});

cdk.CfnOutput(stack, "RoleArn", {
  value: githubRole.role.roleArn,
});
```

GitHub action using the generated Role's ARN:

```yaml
jobs:
  deploy:
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: ap-southeast-2
          role-to-assume: ${{ secrets.ROLE_ARN }}
          role-duration-seconds: 1800
          output-credentials: true
          mask-aws-account-id: true
      - name: Deploy CDK
        run: npm run cdk deploy
```
