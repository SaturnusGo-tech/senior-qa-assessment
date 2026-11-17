@ignore
Feature: Remove only the temporary account owned by this scenario

  Scenario:
    * configure afterScenario = null
    Given url baseUrl
    And path 'Account', 'v1', 'GenerateToken'
    And request { userName: '#(userName)', password: '#(testPassword)' }
    When method post
    Then status 200
    And match response contains { status: 'Success', token: '#string' }
    * def cleanupToken = response.token
    * assert cleanupToken.length > 0

    Given url baseUrl
    And path 'Account', 'v1', 'User', userId
    And header Authorization = 'Bearer ' + cleanupToken
    When method delete
    Then status 204
