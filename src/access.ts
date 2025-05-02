/**
 * @see https://umijs.org/zh-CN/plugins/plugin-access
 * */
export default function access(initialState: { currentUser?: API.CurrentUser } | undefined) {
  const {currentUser} = initialState ?? {};
  console.log(currentUser);
  return {
    canAdmin: currentUser && currentUser.access === 'admin',
    canTest: currentUser && currentUser.access === 'test',
    canGuest: currentUser && (currentUser.access === 'guest' || currentUser.access === 'admin'), // guest和admin都可以访问guest权限页面
    isGuestOnly: currentUser && currentUser.access === 'guest', // 仅guest用户
  };
}
