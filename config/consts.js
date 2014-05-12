module.exports = {
    // declare consts
    page_size: 20, // page size

    // declare api paths for user

    url_user_get: '/api/user/:token', // get
    url_user_logout: '/api/user/logout', // post
    url_user_register: '/api/user/register', // post
    url_user_login: '/api/user/login', // post
    url_user_update: '/api/user/:token', // put

    // declare api paths for place
    url_place_log_time: '/api/place', // put
    url_place_get_date_spent: '/api/place/:country_name', // get
    url_place_list: '/api/place', // get
    url_place_log_time_array: '/api/place/array', // put
    // declare column query

    user_column_query: '_id fullname email token dateUpdated dateCreated'
};