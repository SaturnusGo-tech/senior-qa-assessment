Feature: Book collection lifecycle

  Background:
    * def userId = null
    * def token = null
    * def userName = 'qa_' + java.util.UUID.randomUUID().toString().replace(/-/g, '')
    * configure afterScenario =
      """
      function() {
        var id = karate.get('userId');
        if (id) {
          karate.call('classpath:features/cleanup.feature', {
            baseUrl: karate.get('baseUrl'), userId: id,
            userName: karate.get('userName'), testPassword: karate.get('testPassword')
          });
        }
      }
      """

  Scenario: Register, authenticate, find a title, add, view and remove it
    Given url baseUrl
    And path 'Account', 'v1', 'User'
    And request { userName: '#(userName)', password: '#(testPassword)' }
    When method post
    Then status 201
    * def userId = response.userID
    * match userId == '#uuid'

    Given url baseUrl
    And path 'Account', 'v1', 'GenerateToken'
    And request { userName: '#(userName)', password: '#(testPassword)' }
    When method post
    Then status 200
    And match response contains { status: 'Success', token: '#string' }
    * def token = response.token
    * assert token.length > 0

    # DemoQA authorization becomes true after generating a token.
    Given url baseUrl
    And path 'Account', 'v1', 'Authorized'
    And request { userName: '#(userName)', password: '#(testPassword)' }
    When method post
    Then status 200
    # This endpoint sends a JSON boolean as text; normalize before matching.
    * json authorized = response
    * match authorized == true

    Given url baseUrl
    And path 'BookStore', 'v1', 'Books'
    When method get
    Then status 200
    * def matches = karate.filter(response.books, function(b){ return b.title == 'Speaking JavaScript' })
    * match matches == '#[1]'
    * def book = matches[0]
    * match book contains { isbn: '#string', title: 'Speaking JavaScript' }

    Given url baseUrl
    And path 'BookStore', 'v1', 'Books'
    And header Authorization = 'Bearer ' + token
    And request { userId: '#(userId)', collectionOfIsbns: [{ isbn: '#(book.isbn)' }] }
    When method post
    Then status 201
    And match response.books == [{ isbn: '#(book.isbn)' }]

    Given url baseUrl
    And path 'Account', 'v1', 'User', userId
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response.userId == userId
    And match response.username == userName
    And match response.books == '#[1]'
    And match response.books[0].isbn == book.isbn

    Given url baseUrl
    And path 'BookStore', 'v1', 'Book'
    And header Authorization = 'Bearer ' + token
    And request { isbn: '#(book.isbn)', userId: '#(userId)' }
    When method delete
    Then status 204

    Given url baseUrl
    And path 'Account', 'v1', 'User', userId
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
    And match response.books == []

    # No logout / token-revocation endpoint exists in the published contract^^
    * def token = null
    Given url baseUrl
    And path 'Account', 'v1', 'User', userId
    When method get
    Then status 401

    # Check cleanup on the success path; the hook is fallback after earlier failure
    * call read('classpath:features/cleanup.feature')
    * def userId = null
