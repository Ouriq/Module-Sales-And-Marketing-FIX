import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateNewUserData {
  user_insert: User_Key;
}

export interface CreateNewUserVariables {
  uid: string;
  email: string;
  username: string;
  name: string;
}

export interface Department_Key {
  id: UUIDString;
  __typename?: 'Department_Key';
}

export interface GetUserProfileData {
  user?: {
    id: string;
    fullName: string;
    email: string;
    username: string;
    role: string;
    status: string;
    createdAt: TimestampString;
  } & User_Key;
}

export interface GetUserProfileVariables {
  uid: string;
}

export interface ListAllUsersWithDepartmentsData {
  users: ({
    id: string;
    fullName: string;
    role: string;
    status: string;
    userDepartments_on_user: ({
      assignedAt: TimestampString;
      department: {
        name: string;
        description?: string | null;
      };
    })[];
  } & User_Key)[];
}

export interface RecordSignInLogData {
  signInLog_insert: SignInLog_Key;
}

export interface RecordSignInLogVariables {
  userId: string;
  ip?: string | null;
  agent?: string | null;
  status: string;
}

export interface SignInLog_Key {
  id: UUIDString;
  __typename?: 'SignInLog_Key';
}

export interface UserDepartment_Key {
  id: UUIDString;
  __typename?: 'UserDepartment_Key';
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

interface CreateNewUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewUserVariables): MutationRef<CreateNewUserData, CreateNewUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewUserVariables): MutationRef<CreateNewUserData, CreateNewUserVariables>;
  operationName: string;
}
export const createNewUserRef: CreateNewUserRef;

export function createNewUser(vars: CreateNewUserVariables): MutationPromise<CreateNewUserData, CreateNewUserVariables>;
export function createNewUser(dc: DataConnect, vars: CreateNewUserVariables): MutationPromise<CreateNewUserData, CreateNewUserVariables>;

interface RecordSignInLogRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RecordSignInLogVariables): MutationRef<RecordSignInLogData, RecordSignInLogVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RecordSignInLogVariables): MutationRef<RecordSignInLogData, RecordSignInLogVariables>;
  operationName: string;
}
export const recordSignInLogRef: RecordSignInLogRef;

export function recordSignInLog(vars: RecordSignInLogVariables): MutationPromise<RecordSignInLogData, RecordSignInLogVariables>;
export function recordSignInLog(dc: DataConnect, vars: RecordSignInLogVariables): MutationPromise<RecordSignInLogData, RecordSignInLogVariables>;

interface GetUserProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserProfileVariables): QueryRef<GetUserProfileData, GetUserProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserProfileVariables): QueryRef<GetUserProfileData, GetUserProfileVariables>;
  operationName: string;
}
export const getUserProfileRef: GetUserProfileRef;

export function getUserProfile(vars: GetUserProfileVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserProfileData, GetUserProfileVariables>;
export function getUserProfile(dc: DataConnect, vars: GetUserProfileVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserProfileData, GetUserProfileVariables>;

interface ListAllUsersWithDepartmentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllUsersWithDepartmentsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllUsersWithDepartmentsData, undefined>;
  operationName: string;
}
export const listAllUsersWithDepartmentsRef: ListAllUsersWithDepartmentsRef;

export function listAllUsersWithDepartments(options?: ExecuteQueryOptions): QueryPromise<ListAllUsersWithDepartmentsData, undefined>;
export function listAllUsersWithDepartments(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAllUsersWithDepartmentsData, undefined>;

