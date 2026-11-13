import copy
import json
import unittest

from scripts import import_playground_study as importer


class PlaygroundStudyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sources = importer.load_sources()

    def test_pinned_study_shape_and_published_output(self):
        study = importer.normalize(self.sources)
        published = json.loads(importer.OUTPUT.read_text(encoding="utf-8"))
        self.assertEqual(study, published)
        self.assertEqual(len(study["pairs"]), 24)
        self.assertEqual(len(study["tasks"]), 8)
        self.assertEqual(sum(pair["kind"] == "qualitative" for pair in study["pairs"]), 18)
        self.assertEqual(sum(pair["kind"] == "control" for pair in study["pairs"]), 6)
        self.assertEqual(sum(response["status"] == "completed" for pair in study["pairs"] for response in pair["responses"].values()), 48)
        self.assertEqual(sum(item["baseCorrect"] for item in study["manualControls"]), 4)
        self.assertEqual(sum(item["candidateCorrect"] for item in study["manualControls"]), 2)
        self.assertEqual(sum(item["total"] for item in study["manualControls"]), 6)
        self.assertEqual(study["development"][1]["status"], "error")
        self.assertTrue(study["development"][1]["errors"])

    def test_no_blind_review_or_fake_scores(self):
        study = importer.normalize(self.sources)
        self.assertNotIn("reviewKey", study)
        self.assertNotIn("reviews", study)
        for pair in study["pairs"]:
            self.assertNotIn("score", pair)
            self.assertEqual(set(pair["responses"]), {"base", "candidate"})

    def test_duplicate_pair_is_rejected(self):
        sources = copy.deepcopy(self.sources)
        pairs = sources["agi-v2-heldout-results.json"]["pairs"]
        pairs[1] = copy.deepcopy(pairs[0])
        with self.assertRaisesRegex(ValueError, "duplicate pair"):
            importer.normalize(sources)

    def test_mismatched_development_is_rejected(self):
        sources = copy.deepcopy(self.sources)
        sources["agi-v2-heldout-results.json"]["development_sha256"] = "wrong"
        with self.assertRaisesRegex(ValueError, "development record"):
            importer.normalize(sources)


if __name__ == "__main__":
    unittest.main()
