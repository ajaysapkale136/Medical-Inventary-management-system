package com.v.demo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class DemoApplicationTests {

	@Test
	void applicationClassIsPackaged() {
		assertDoesNotThrow(() -> Class.forName("com.v.medical.DemoApplication"));
	}

}
