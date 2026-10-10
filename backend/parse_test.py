import unittest

from parse import accepted, needs_parse


class ParseTests(unittest.TestCase):
    def test_keeps_known_fields_and_stringifies_numbers(self):
        props = {"q": {}, "max_price": {}, "check_in_date": {}, "check_out_date": {}}
        got = accepted(
            {"q": " Seattle ", "max_price": 1000, "check_in_date": "2026-10-12", "invented": "no"},
            props,
        )
        self.assertEqual(got, {"q": "Seattle", "max_price": "1000", "check_in_date": "2026-10-12"})

    def test_accepts_a_one_item_list(self):
        props = {"q": {}, "max_price": {}, "check_in_date": {}, "check_out_date": {}}
        got = accepted(
            [{"q": "seattle", "max_price": "1000", "check_in_date": "2026-10-12", "check_out_date": "2026-10-15"}],
            props,
        )
        self.assertEqual(got["check_in_date"], "2026-10-12")
        self.assertEqual(got["max_price"], "1000")

    def test_unwraps_a_parameters_object(self):
        props = {"q": {}, "max_price": {}}
        got = accepted({"parameters": {"q": "Seattle", "max_price": "1000"}}, props)
        self.assertEqual(got["q"], "Seattle")
        self.assertEqual(got["max_price"], "1000")

    def test_drops_blank_and_token_fields(self):
        props = {"q": {}, "check_in_date": {}, "next_page_token": {}}
        self.assertEqual(accepted({"q": "", "check_in_date": None, "next_page_token": "abc"}, props), {})

    def test_hotels_need_a_parse_and_plain_web_search_does_not(self):
        self.assertTrue(needs_parse({"q": {}, "check_in_date": {}, "max_price": {}}, ["q", "check_in_date"]))
        self.assertFalse(needs_parse({"q": {}, "hl": {}, "gl": {}}, ["q"]))


if __name__ == "__main__":
    unittest.main()
