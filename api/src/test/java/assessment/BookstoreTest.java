package assessment;

import com.intuit.karate.junit5.Karate;

class BookstoreTest {
    @Karate.Test
    Karate collectionLifecycle() {
        return Karate.run("classpath:features/bookstore.feature");
    }
}
