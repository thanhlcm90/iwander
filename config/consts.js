module.exports = {
    // declare consts
    page_size: 20 // page size

    // declare api paths for user
    ,
    url_user_get: '/api/user/:token' // get
    ,
    url_user_logout: '/api/user/logout' // post
    ,
    url_user_register: '/api/user/register' // post
    ,
    url_user_login: '/api/user/login' // post
    ,
    url_user_update: '/api/user/:token' // put

    // declare column query
    ,
    user_column_query: '_id fullname email token dateUpdated dateCreated'
}