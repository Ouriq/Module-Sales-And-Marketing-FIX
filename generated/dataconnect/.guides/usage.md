# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createNewUser, recordSignInLog, getUserProfile, listAllUsersWithDepartments } from '@dataconnect/erp';


// Operation CreateNewUser:  For variables, look at type CreateNewUserVars in ../index.d.ts
const { data } = await CreateNewUser(dataConnect, createNewUserVars);

// Operation RecordSignInLog:  For variables, look at type RecordSignInLogVars in ../index.d.ts
const { data } = await RecordSignInLog(dataConnect, recordSignInLogVars);

// Operation GetUserProfile:  For variables, look at type GetUserProfileVars in ../index.d.ts
const { data } = await GetUserProfile(dataConnect, getUserProfileVars);

// Operation ListAllUsersWithDepartments: 
const { data } = await ListAllUsersWithDepartments(dataConnect);


```