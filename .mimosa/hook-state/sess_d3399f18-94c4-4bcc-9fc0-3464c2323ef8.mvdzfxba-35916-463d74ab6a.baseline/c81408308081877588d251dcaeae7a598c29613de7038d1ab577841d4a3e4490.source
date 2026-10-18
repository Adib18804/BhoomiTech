"""
Deterministic Rule-Based Verification Engine for BhoomiTech
NO AI, NO ML, NO LLM - Pure rule-based logic
"""

from typing import List, Dict, Any, Tuple
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import (
    LandParcel, OwnershipRecord, HistoricalRecord, MutationRecord,
    CaseRecord, GovernmentStatusRecord, AcquisitionRecord, Transaction
)


# ---------------------------------------------------------------------------
# Structured bilingual content (Phase 7).
# Every user-facing finding carries English AND Bengali from this service
# layer. Keyed by the stable English title; the VerificationFinding
# constructor fills the *_bn fields from here. UI language selection happens
# in the frontend; the data itself is bilingual end-to-end.
# ---------------------------------------------------------------------------
FINDING_TRANSLATIONS_BN: Dict[str, Dict[str, str]] = {
    "Land Identity Verified": {
        "title_bn": "জমির পরিচয় যাচাই হয়েছে",
        "description_bn": "উপলব্ধ ডেটাসেটে জমির পার্সেল {parcel_id} পাওয়া গেছে।",
        "explanation_bn": "প্রদত্ত জমির শনাক্তকরণ তথ্য সিস্টেমের একটি রেকর্ডের সাথে মিলেছে।",
        "recommendation_bn": "মালিকানা যাচাইকরণের সাথে এগিয়ে যান।",
    },
    "Land Identity Not Found": {
        "title_bn": "জমির পরিচয় পাওয়া যায়নি",
        "description_bn": "উপলব্ধ ডেটাসেটে নির্দিষ্ট জমির পার্সেলটি পাওয়া যায়নি।",
        "recommendation_bn": "জমির শনাক্তকরণ তথ্য যাচাই করে আবার চেষ্টা করুন।",
    },
    "No Ownership Record Found": {
        "title_bn": "কোনো মালিকানা রেকর্ড পাওয়া যায়নি",
        "description_bn": "উপলব্ধ ডেটাসেটে কোনো রেকর্ডকৃত মালিকানা তথ্য পাওয়া যায়নি।",
        "explanation_bn": "মালিকানা রেকর্ড না থাকায় সম্পূর্ণ যাচাইকরণ সম্ভব হচ্ছে না।",
        "recommendation_bn": "অপর্যাপ্ত তথ্য: ভূমি রেজিস্ট্রি থেকে প্রাতিষ্ঠানিক মালিকানা দলিল সংগ্রহ করুন।",
    },
    "Potential Ownership Mismatch": {
        "title_bn": "সম্ভাব্য মালিকানা অমিল",
        "description_bn": "দাবিকৃত মালিক '{claimed_owner}' রেকর্ডকৃত মালিক/মালিকদের সাথে মিলছে না: {recorded_owners}",
        "explanation_bn": "বিক্রেতার দেওয়া মালিকানা তথ্য উপলব্ধ রেকর্ডকৃত মালিকের তথ্যের সাথে ভিন্ন।",
        "recommendation_bn": "উচ্চ মনোযোগ: বিক্রেতার মালিকানা দলিল যাচাই করুন। প্রাতিষ্ঠানিক দলিল/রেজিস্ট্রি কপি চান।",
    },
    "Share Exceeds Recorded Amount": {
        "title_bn": "দাবিকৃত শেয়ার রেকর্ডকৃত পরিমাণের অধিক",
        "description_bn": "দাবিকৃত শেয়ার ({claimed_share}) রেকর্ডকৃত মোট শেয়ারের ({recorded_share}) চেয়ে বেশি।",
        "explanation_bn": "বিক্রেতা উপলব্ধ মালিকানা তথ্যের চেয়ে বেশি জমির দাবি করছেন।",
        "recommendation_bn": "পর্যালোচনা প্রয়োজন: প্রাতিষ্ঠানিক দলিলের মাধ্যমে প্রকৃত মালিকানা শেয়ার যাচাই করুন।",
    },
    "Ownership Match Found": {
        "title_bn": "মালিকানা মিল পাওয়া গেছে",
        "description_bn": "দাবিকৃত মালিকের নাম রেকর্ডকৃত মালিকানা তথ্যের সাথে মিলেছে।",
        "explanation_bn": "বিক্রেতার দেওয়া নাম রেকর্ডকৃত মালিকানা তথ্যে পাওয়া গেছে।",
        "recommendation_bn": "অন্যান্য যাচাইকরণ ধাপের সাথে এগিয়ে যান।",
    },
    "No Mutation Record Found": {
        "title_bn": "কোনো মিউটেশন রেকর্ড পাওয়া যায়নি",
        "description_bn": "উপলব্ধ ডেটাসেটে এই পার্সেলের জন্য কোনো মিউটেশন রেকর্ড পাওয়া যায়নি।",
        "explanation_bn": "এর অর্থ মিউটেশনের অনুপস্থিতি নিশ্চিত নয় — শুধু উপলব্ধ তথ্যে পাওয়া যায়নি।",
        "recommendation_bn": "অপর্যাপ্ত তথ্য: ইউনিয়ন ভূমি অফিস বা এসি ল্যান্ড অফিস থেকে মিউটেশনের অবস্থা যাচাই করুন।",
    },
    "Pending Mutation Detected": {
        "title_bn": "মুলতুবি মিউটেশন পাওয়া গেছে",
        "description_bn": "{mutation_count}টি মুলতুবি/পর্যালোচনাধীন মিউটেশন রেকর্ড পাওয়া গেছে।",
        "explanation_bn": "মিউটেশন আবেদন অনুমোদনের অপেক্ষায় আছে। মালিকানা হস্তান্তর এখনো সম্পন্ন হয়নি।",
        "recommendation_bn": "পর্যালোচনা প্রয়োজন: লেনদেনের আগে মিউটেশন অনুমোদনের অবস্থা নিশ্চিত করুন।",
    },
    "Approved Mutation Found": {
        "title_bn": "অনুমোদিত মিউটেশন পাওয়া গেছে",
        "description_bn": "{approved_count}টি অনুমোদিত মিউটেশন রেকর্ড পাওয়া গেছে।",
        "explanation_bn": "মিউটেশন অনুমোদিত হয়েছে, যা সম্পন্ন মালিকানা হস্তান্তর প্রক্রিয়া নির্দেশ করে।",
        "recommendation_bn": "মিউটেশন সনদ বর্তমান বিক্রেতার তথ্যের সাথে মিলছে কিনা যাচাই করুন।",
    },
    "No Case Record Found": {
        "title_bn": "কোনো মামলার রেকর্ড পাওয়া যায়নি",
        "description_bn": "উপলব্ধ ডেটাসেটে কোনো মিলকৃত মামলার রেকর্ড পাওয়া যায়নি।",
        "explanation_bn": "এর অর্থ আইনি বিরোধের অনুপস্থিতি নিশ্চিত নয় — শুধু উপলব্ধ তথ্যে পাওয়া যায়নি।",
        "recommendation_bn": "একটি আইনি ছাড়পত্র সনদ সংগ্রহ করার বিষয়ে বিবেচনা করুন।",
    },
    "CASE SIGNAL FOUND": {
        "title_bn": "মামলার সংকেত পাওয়া গেছে",
        "description_bn": "এই পার্সেল সংক্রান্ত {case_count}টি চলমান আইনি মামলা পাওয়া গেছে।",
        "explanation_bn": "মুলতুবি বা চলমান আইনি মামলা মালিকানা হস্তান্তরের বৈধতাকে প্রভাবিত করতে পারে।",
        "recommendation_bn": "জরুরি সংকেত: আইনজীবীর পরামর্শ নিন। এগোনোর আগে মামলার বিবরণ ও আদালতের আদেশ সংগ্রহ করুন।",
    },
    "No Government Interest Found": {
        "title_bn": "সরকারি স্বার্থ পাওয়া যায়নি",
        "description_bn": "উপলব্ধ ডেটাসেটে কোনো সরকারি স্বার্থ বা খাস জমির রেকর্ড পাওয়া যায়নি।",
        "explanation_bn": "এর অর্থ সরকারি স্বার্থের অনুপস্থিতি নিশ্চিত নয় — শুধু উপলব্ধ তথ্যে পাওয়া যায়নি।",
    },
    "GOVERNMENT INTEREST SIGNAL": {
        "title_bn": "সরকারি স্বার্থের সংকেত",
        "description_bn": "সরকারি স্বার্থ বা খাস জমির অবস্থা পাওয়া গেছে: {status_types}",
        "explanation_bn": "সরকারি স্বার্থ বা খাস জমির মর্যাদা ব্যক্তিগত লেনদেন সীমিত বা নিষিদ্ধ করতে পারে।",
        "recommendation_bn": "জরুরি সংকেত: এসি ল্যান্ড অফিসে যাচাই করুন। সরকারি/খাস জমি ব্যক্তিগতভাবে হস্তান্তরযোগ্য নাও হতে পারে।",
    },
    "No Acquisition Record Found": {
        "title_bn": "কোনো অধিগ্রহণ রেকর্ড পাওয়া যায়নি",
        "description_bn": "উপলব্ধ ডেটাসেটে কোনো অধিগ্রহণ রেকর্ড পাওয়া যায়নি।",
        "explanation_bn": "এর অর্থ অধিগ্রহণ কার্যক্রমের অনুপস্থিতি নিশ্চিত নয়।",
    },
    "ACQUISITION SIGNAL FOUND": {
        "title_bn": "অধিগ্রহণের সংকেত পাওয়া গেছে",
        "description_bn": "জমি অধিগ্রহণের অবস্থা: {acquisition_statuses}",
        "explanation_bn": "অধিগ্রহণাধীন জমি ব্যক্তিগতভাবে হস্তান্তরযোগ্য নাও হতে পারে বা সরকারি অধিগ্রহণের অধীন থাকতে পারে।",
        "recommendation_bn": "জরুরি সংকেত: জেলা প্রশাসকের কার্যালয় ও ভূমি অধিগ্রহণ বিভাগে যাচাই করুন। ছাড়পত্র ছাড়া এগোবেন না।",
    },
    "No Prior Transaction Found": {
        "title_bn": "পূর্ববর্তী কোনো লেনদেন পাওয়া যায়নি",
        "description_bn": "উপলব্ধ ডেটাসেটে কোনো লেনদেন রেকর্ড পাওয়া যায়নি।",
        "explanation_bn": "এর অর্থ পূর্ববর্তী লেনদেনের অনুপস্থিতি নিশ্চিত নয়।",
    },
    "POTENTIAL TRANSACTION OVERLAP": {
        "title_bn": "সম্ভাব্য লেনদেন ওভারল্যাপ",
        "description_bn": "পূর্ববর্তী লেনদেন ({prior_transactions} শতাংশ) + বর্তমান ({claimed_sale} শতাংশ) = {calculated_total} শতাংশ, যা মোট এলাকা ({total_area} শতাংশ) অতিক্রম করেছে।",
        "explanation_bn": "সম্মিলিত লেনদেনের এলাকা মোট পার্সেল এলাকার চেয়ে বেশি, যা সম্ভাব্য দ্বৈত বিক্রয় বা পরস্পরবিরোধী দাবি নির্দেশ করে।",
        "recommendation_bn": "জরুরি সংকেত: সম্ভাব্য লেনদেন ওভারল্যাপ শনাক্ত হয়েছে। সকল পূর্ববর্তী লেনদেন ও বিক্রেতার প্রকৃত উপলব্ধ শেয়ার যাচাই করুন।",
    },
    "No Transaction Overlap Detected": {
        "title_bn": "কোনো লেনদেন ওভারল্যাপ পাওয়া যায়নি",
        "description_bn": "লেনদেনের এলাকা পার্সেলের সীমার মধ্যে রয়েছে।",
        "explanation_bn": "উপলব্ধ রেকর্ড অনুযায়ী সম্মিলিত লেনদেনের এলাকা মোট পার্সেল এলাকা অতিক্রম করেনি।",
    },
    "No Historical Record Found": {
        "title_bn": "কোনো ঐতিহাসিক রেকর্ড পাওয়া যায়নি",
        "description_bn": "এই পার্সেলের জন্য উপলব্ধ ডেটাসেটে কোনো ঐতিহাসিক মালিকানা/জরিপ রেকর্ড পাওয়া যায়নি।",
        "explanation_bn": "ঐতিহাসিক রেকর্ড (যেমন সিএস/এসএ/আরএস/বিএস জরিপের ধারাবাহিকতা) না থাকায় মালিকানার ইতিহাস যাচাই করা সম্ভব নয়।",
        "recommendation_bn": "অপর্যাপ্ত তথ্য: ভূমি রেকর্ড অফিস থেকে পূর্ববর্তী খতিয়ানের (সিএস/এসএ/আরএস/বিএস) সনাক্তকৃত কপি সংগ্রহ করুন।",
    },
    "Potential Date Inconsistency": {
        "title_bn": "সম্ভাব্য তারিখের অসঙ্গতি",
        "description_bn": "{future_count}টি ঐতিহাসিক রেকর্ডে ভবিষ্যতের তারিখ রয়েছে।",
        "explanation_bn": "ভবিষ্যতের তারিখযুক্ত রেকর্ড উপলব্ধ ডেটাসেটে তথ্যভুল নির্দেশ করতে পারে।",
        "recommendation_bn": "পর্যালোচনা প্রয়োজন: ভূমি রেকর্ড অফিসে রেকর্ডের তারিখ যাচাই করুন।",
    },
    "Historical Area Inconsistency": {
        "title_bn": "ঐতিহাসিক এলাকার অসঙ্গতি",
        "description_bn": "{inconsistent_count}টি ঐতিহাসিক রেকর্ডে বর্তমান পার্সেল এলাকার ({total_area} শতাংশ) ভিন্ন এলাকা উল্লেখ আছে: {details}",
        "explanation_bn": "ঐতিহাসিক জরিপ প্রজন্ম ও বর্তমান রেকর্ডের মধ্যে এলাকার পার্থক্য বৈধ হতে পারে (বিভাজন, পুনর্জরিপ) অথবা রেকর্ডের অসঙ্গতি নির্দেশ করতে পারে।",
        "recommendation_bn": "পর্যালোচনা প্রয়োজন: সিএস/এসএ/আরএস/বিএস খতিয়ান তুলনা করুন। এটিকে নিশ্চিত অনিয়ম হিসেবে গণ্য করবেন না — প্রাতিষ্ঠানিক জরিপ রেকর্ড সংগ্রহ করুন।",
    },
    "Ownership Chain Gap": {
        "title_bn": "মালিকানা ধারার বিরতি",
        "description_bn": "{break_count}টি স্থানান্তরে পূর্ববর্তী রেকর্ডের নতুন মালিক পরবর্তী রেকর্ডের পূর্ববর্তী মালিকের সাথে মিলছে না।",
        "explanation_bn": "মালিকানা ধারার বিরতি বৈধ হতে পারে (মধ্যবর্তী রেকর্ডের অনুপস্থিতি) এবং দলিলভিত্তিক যাচাই প্রয়োজন।",
        "recommendation_bn": "পর্যালোচনা প্রয়োজন: সকল স্থানান্তর কভার করে এমন দলিল ও মিউটেশনের ধারাবাহিক দলিলপত্র চান।",
    },
    "Historical Records Consistent": {
        "title_bn": "ঐতিহাসিক রেকর্ড সামঞ্জস্যপূর্ণ",
        "description_bn": "{historical_record_count}টি ঐতিহাসিক রেকর্ড কালানুক্রমিকভাবে সাজানো এবং বর্তমান পার্সেল রেকর্ডের সাথে এলাকায় সামঞ্জস্যপূর্ণ।",
        "explanation_bn": "উপলব্ধ ঐতিহাসিক রেকর্ড ও বর্তমান পার্সেল রেকর্ডের মধ্যে কোনো অভ্যন্তরীণ অসঙ্গতি পাওয়া যায়নি।",
        "recommendation_bn": "অন্যান্য যাচাইকরণ ধাপের সাথে এগিয়ে যান।",
    },
    "Seller Share Not Stated": {
        "title_bn": "বিক্রেতার শেয়ার উল্লেখ নেই",
        "description_bn": "বিক্রেতা শেয়ার/এলাকার পরিমাণ উল্লেখ করেননি, তাই এলাকা/শেয়ার গণনা করা সম্ভব হচ্ছে না।",
        "explanation_bn": "রেকর্ডকৃত মালিকানা শেয়ারের সাথে তুলনা করতে দাবিকৃত শেয়ার প্রয়োজন।",
        "recommendation_bn": "অপর্যাপ্ত তথ্য: বিক্রেতার দাবিকৃত শেয়ার জেনে খতিয়ানের রেকর্ডকৃত শেয়ারের সাথে তুলনা করুন।",
    },
    "No Recorded Share for Claimed Owner": {
        "title_bn": "দাবিকৃত মালিকের রেকর্ডকৃত শেয়ার নেই",
        "description_bn": "এই পার্সেলে '{claimed_owner}'-এর নামে কোনো সক্রিয় মালিকানা শেয়ার রেকর্ড পাওয়া যায়নি, তাই প্রত্যাশিত শেয়ার গণনা করা যায়নি।",
        "explanation_bn": "এলাকা/শেয়ার তুলনার জন্য দাবিকৃত মালিকের রেকর্ডকৃত শেয়ারের শতাংশ প্রয়োজন।",
        "recommendation_bn": "অপর্যাপ্ত তথ্য: খতিয়ানে দাবিকৃত মালিকের রেকর্ডকৃত শেয়ার যাচাই করুন।",
    },
    "Potential Area/Share Conflict": {
        "title_bn": "সম্ভাব্য এলাকা/শেয়ার দ্বন্দ্ব",
        "description_bn": "দাবিকৃত এলাকা ({claimed_area_decimal} শতাংশ) বিক্রেতার প্রত্যাশিত শেয়ারের ({expected_seller_area_decimal} শতাংশ = {total_area_decimal} শতাংশ × {recorded_share_percent}%) চেয়ে বেশি।",
        "explanation_bn": "বিক্রেতা তার রেকর্ডকৃত মালিকানা শেয়ারের চেয়ে বেশি জমির দাবি করছেন। এটি যৌথ মালিকানা সম্পর্কে ভুল বোঝাবুঝি বা সম্ভাব্য বিভ্রান্তিকর উপস্থাপনা হতে পারে।",
        "recommendation_bn": "উচ্চ মনোযোগ: বর্তমান খতিয়ানে বিক্রেতার প্রকৃত শেয়ার যাচাই করুন। শুধু বিক্রেতার বলা এলাকার উপর নির্ভর করবেন না।",
    },
    "Area/Share Consistent": {
        "title_bn": "এলাকা/শেয়ার সামঞ্জস্যপূর্ণ",
        "description_bn": "দাবিকৃত এলাকা ({claimed_area_decimal} শতাংশ) বিক্রেতার প্রত্যাশিত শেয়ারের ({expected_seller_area_decimal} শতাংশ = {total_area_decimal} শতাংশ × {recorded_share_percent}%) মধ্যে রয়েছে।",
        "explanation_bn": "নির্ধারিত এলাকা/শেয়ার গণনা রেকর্ডকৃত মালিকানা শেয়ারের সাথে সামঞ্জস্যপূর্ণ।",
    },
    "Ownership Shares Do Not Total 100%": {
        "title_bn": "মালিকানা শেয়ার ১০০% হচ্ছে না",
        "description_bn": "সক্রিয় মালিকানা রেকর্ডের মোট {share_total}% (প্রত্যাশিত প্রায় 100%)।",
        "explanation_bn": "শেয়ার ১০০% না হলে সহ-মালিকের রেকর্ড অনুপস্থিত বা তথ্যের অসঙ্গতি নির্দেশ করতে পারে।",
        "recommendation_bn": "পর্যালোচনা প্রয়োজন: সকল সহ-মালিকসহ সম্পূর্ণ খতিয়ান সংগ্রহ করুন।",
    },
    "Mutation Area Differs From Parcel Area": {
        "title_bn": "মিউটেশনের এলাকা পার্সেল এলাকা থেকে ভিন্ন",
        "description_bn": "অনুমোদিত মিউটেশন রেকর্ডে পার্সেলের ({total_area} শতাংশ) ভিন্ন এলাকা উল্লেখ আছে: {details}",
        "explanation_bn": "পার্থক্য বৈধ হতে পারে (আংশিক মিউটেশন, বিভাজন) অথবা রেকর্ডের অসঙ্গতি নির্দেশ করতে পারে।",
        "recommendation_bn": "পর্যালোচনা প্রয়োজন: মিউটেশন সনদ বর্তমান খতিয়ানের সাথে তুলনা করুন।",
    },
    "Recorded Transactions Exceed Parcel Area": {
        "title_bn": "রেকর্ডকৃত লেনদেন পার্সেল এলাকা অতিক্রম করেছে",
        "description_bn": "রেকর্ডকৃত লেনদেনের মোট {transacted} শতাংশ, পার্সেলের এলাকা {total_area} শতাংশ।",
        "explanation_bn": "পার্সেল এলাকার চেয়ে বেশি সম্মিলিত রেকর্ডকৃত হস্তান্তর সম্ভাব্য দ্বৈত বিক্রয় বা রেকর্ডের ভুল নির্দেশ করে।",
        "recommendation_bn": "পর্যালোচনা প্রয়োজন: এই দাগের সকল পূর্ববর্তী দলিল সংগ্রহ করে এলাকা মিলিয়ে দেখুন।",
    },
    "Government Interest With Recent Mutation": {
        "title_bn": "সরকারি স্বার্থ ও সাম্প্রতিক মিউটেশন একসাথে",
        "description_bn": "এই পার্সেলে সরকারি স্বার্থ/অধিগ্রহণের রেকর্ড এবং অনুমোদিত মিউটেশন উভয়ই রয়েছে।",
        "explanation_bn": "এই দুটি বৈধভাবে একসাথে থাকতে পারে (যেমন মিউটেশন অধিগ্রহণের আগে), তবে ভূমি অফিসে মিলিয়ে দেখা উচিত।",
        "recommendation_bn": "পর্যালোচনা প্রয়োজন: এসি ল্যান্ড অফিসে মিউটেশন ও সরকারি/অধিগ্রহণ রেকর্ডের ক্রম নিশ্চিত করুন।",
    },
    "Cross-Record Consistency Passed": {
        "title_bn": "আড়াআড়ি রেকর্ড সামঞ্জস্য উত্তীর্ণ",
        "description_bn": "মালিকানা, মিউটেশন, লেনদেন, সরকারি ও অধিগ্রহণ রেকর্ডের মধ্যে কোনো বিরোধ পাওয়া যায়নি।",
        "explanation_bn": "এই পার্সেলের সকল উপলব্ধ রেকর্ড প্রকার পারস্পরিকভাবে সামঞ্জস্যপূর্ণ।",
    },
}


def _safe_format(template, context: Dict[str, Any] = None):
    """Format a Bengali template with named values, tolerating missing keys
    (str.format_map with a default-dict-like fallback). Returns None when no
    template is given. List values are rendered as comma-joined text."""
    if not template:
        return None
    prepared = {}
    for k, v in (context or {}).items():
        prepared[k] = ", ".join(str(x) for x in v) if isinstance(v, list) else v
    try:
        return template.format_map(_SafeDict(prepared))
    except Exception:
        return template


class _SafeDict(dict):
    def __missing__(self, key):
        return "{" + key + "}"


class VerificationFinding:
    def __init__(
        self,
        check_type: str,
        finding_type: str,
        severity: str,
        title_en: str,
        description_en: str,
        explanation_en: str = None,
        recommendation_en: str = None,
        related_data: Dict[str, Any] = None,
        # Structured bilingual content (Phase 7): every user-facing finding
        # carries both languages from the service layer.
        title_bn: str = None,
        description_bn: str = None,
        explanation_bn: str = None,
        recommendation_bn: str = None
    ):
        self.check_type = check_type
        self.finding_type = finding_type
        self.severity = severity
        self.title_en = title_en
        self.description_en = description_en
        self.explanation_en = explanation_en
        self.recommendation_en = recommendation_en
        self.related_data = related_data or {}

        # Structured bilingual content: fill *_bn fields from the central
        # dictionary. Templates may reference the same named values the
        # English text interpolates (via related_data).
        bn = FINDING_TRANSLATIONS_BN.get(title_en, {})
        context = dict(self.related_data)
        self.title_bn = title_bn or bn.get("title_bn")
        self.description_bn = description_bn or _safe_format(bn.get("description_bn"), context)
        self.explanation_bn = explanation_bn or _safe_format(bn.get("explanation_bn"), context)
        self.recommendation_bn = recommendation_bn or _safe_format(bn.get("recommendation_bn"), context)


class VerificationCheckResult:
    def __init__(self, check_name: str, status: str, findings: List[VerificationFinding]):
        self.check_name = check_name
        self.status = status
        self.findings = findings


class VerificationEngine:
    
    def __init__(self, db: Session):
        self.db = db
    
    def check_land_identity(self, parcel: LandParcel) -> VerificationCheckResult:
        """Verify land parcel identity is valid"""
        findings = []
        
        if parcel and parcel.status == "active":
            findings.append(VerificationFinding(
                check_type="land_identity",
                finding_type="success",
                severity="low",
                title_en="Land Identity Verified",
                description_en=f"Land parcel {parcel.parcel_id} found in the available dataset.",
                explanation_en="The provided land identifiers match a record in the system.",
                recommendation_en="Proceed with ownership verification.",
                related_data={"parcel_id": parcel.parcel_id}
            ))
            return VerificationCheckResult("Land Identity", "passed", findings)
        else:
            findings.append(VerificationFinding(
                check_type="land_identity",
                finding_type="issue",
                severity="critical",
                title_en="Land Identity Not Found",
                description_en="The specified land parcel could not be found in the available dataset.",
                recommendation_en="Verify the land identifiers and try again."
            ))
            return VerificationCheckResult("Land Identity", "critical", findings)
    
    def check_ownership(
        self,
        parcel: LandParcel,
        claimed_owner: str,
        claimed_share: Decimal
    ) -> VerificationCheckResult:
        """Check ownership against seller claims"""
        findings = []
        
        ownership_records = self.db.query(OwnershipRecord).filter(
            OwnershipRecord.parcel_id == parcel.id,
            OwnershipRecord.status == "active"
        ).all()
        
        if not ownership_records:
            findings.append(VerificationFinding(
                check_type="ownership",
                finding_type="warning",
                severity="high",
                title_en="No Ownership Record Found",
                description_en="No recorded ownership information was found in the available dataset.",
                explanation_en="The absence of ownership records prevents complete verification.",
                recommendation_en="INSUFFICIENT DATA: Obtain official ownership documentation from land registry."
            ))
            return VerificationCheckResult("Ownership", "insufficient_data", findings)
        
        # Check if claimed owner matches any recorded owner
        recorded_owners = [o.owner.name_en for o in ownership_records]
        owner_match = any(claimed_owner.lower() in owner.lower() or owner.lower() in claimed_owner.lower() 
                         for owner in recorded_owners)
        
        if not owner_match:
            findings.append(VerificationFinding(
                check_type="ownership",
                finding_type="issue",
                severity="high",
                title_en="Potential Ownership Mismatch",
                description_en=f"Claimed owner '{claimed_owner}' does not match recorded owner(s): {', '.join(recorded_owners)}",
                explanation_en="The seller-provided ownership information differs from the available recorded owner information.",
                recommendation_en="HIGH ATTENTION: Verify seller's ownership documents. Request official deed/registry copy.",
                related_data={
                    "claimed_owner": claimed_owner,
                    "recorded_owners": recorded_owners
                }
            ))
            return VerificationCheckResult("Ownership", "attention", findings)
        
        # Check share amount
        total_recorded_share = sum(float(o.share_decimal) for o in ownership_records)
        if float(claimed_share) > total_recorded_share:
            findings.append(VerificationFinding(
                check_type="ownership",
                finding_type="warning",
                severity="medium",
                title_en="Share Exceeds Recorded Amount",
                description_en=f"Claimed share ({claimed_share} decimal) exceeds total recorded share ({total_recorded_share} decimal).",
                explanation_en="The seller claims more land than recorded in the available ownership data.",
                recommendation_en="REVIEW REQUIRED: Verify actual ownership share with official documents.",
                related_data={
                    "claimed_share": float(claimed_share),
                    "recorded_share": total_recorded_share
                }
            ))
            return VerificationCheckResult("Ownership", "warning", findings)
        
        findings.append(VerificationFinding(
            check_type="ownership",
            finding_type="success",
            severity="low",
            title_en="Ownership Match Found",
            description_en=f"Claimed owner matches recorded owner information.",
            explanation_en="The seller-provided name appears in the recorded ownership data.",
            recommendation_en="Proceed with additional verification checks."
        ))
        return VerificationCheckResult("Ownership", "passed", findings)
    
    def check_mutation(self, parcel: LandParcel) -> VerificationCheckResult:
        """Check mutation status"""
        findings = []
        
        mutation_records = self.db.query(MutationRecord).filter(
            MutationRecord.parcel_id == parcel.id
        ).all()
        
        if not mutation_records:
            findings.append(VerificationFinding(
                check_type="mutation",
                finding_type="info",
                severity="low",
                title_en="No Mutation Record Found",
                description_en="No mutation record was found in the available dataset for this parcel.",
                explanation_en="This does not confirm the absence of mutations, only that none were found in the available data.",
                recommendation_en="INSUFFICIENT DATA: Verify mutation status with Union Land Office or AC Land Office."
            ))
            return VerificationCheckResult("Mutation", "insufficient_data", findings)
        
        pending_mutations = [m for m in mutation_records if m.status in ["pending", "in_review"]]
        
        if pending_mutations:
            findings.append(VerificationFinding(
                check_type="mutation",
                finding_type="warning",
                severity="medium",
                title_en="Pending Mutation Detected",
                description_en=f"Found {len(pending_mutations)} pending/in-review mutation record(s).",
                explanation_en="A mutation application is pending approval. Ownership transfer is not yet complete.",
                recommendation_en="REVIEW REQUIRED: Confirm mutation approval status before proceeding with transaction.",
                related_data={
                    "mutation_count": len(pending_mutations),
                    "statuses": [m.status for m in pending_mutations]
                }
            ))
            return VerificationCheckResult("Mutation", "warning", findings)
        
        approved_mutations = [m for m in mutation_records if m.status == "approved"]
        if approved_mutations:
            findings.append(VerificationFinding(
                check_type="mutation",
                finding_type="success",
                severity="low",
                title_en="Approved Mutation Found",
                description_en=f"Found {len(approved_mutations)} approved mutation record(s).",
                explanation_en="Mutation has been approved, indicating completed ownership transfer process.",
                recommendation_en="Verify mutation certificate matches current seller information.",
                related_data={"approved_count": len(approved_mutations)}
            ))
            return VerificationCheckResult("Mutation", "passed", findings)
        
        return VerificationCheckResult("Mutation", "passed", findings)
    
    def check_cases(self, parcel: LandParcel) -> VerificationCheckResult:
        """Check for legal cases/disputes"""
        findings = []
        
        case_records = self.db.query(CaseRecord).filter(
            CaseRecord.parcel_id == parcel.id
        ).all()
        
        if not case_records:
            findings.append(VerificationFinding(
                check_type="case",
                finding_type="success",
                severity="low",
                title_en="No Case Record Found",
                description_en="No matching case record was found in the available dataset.",
                explanation_en="This does not guarantee the absence of legal disputes, only that none were found in the available data.",
                recommendation_en="Consider obtaining a legal clearance certificate."
            ))
            return VerificationCheckResult("Legal Cases", "passed", findings)
        
        active_cases = [c for c in case_records if c.status in ["pending", "ongoing"]]
        
        if active_cases:
            findings.append(VerificationFinding(
                check_type="case",
                finding_type="issue",
                severity="critical",
                title_en="CASE SIGNAL FOUND",
                description_en=f"Found {len(active_cases)} active legal case(s) related to this parcel.",
                explanation_en="Pending or ongoing legal cases may affect the validity of ownership transfer.",
                recommendation_en="CRITICAL SIGNAL: Consult with legal counsel. Obtain case details and court orders before proceeding.",
                related_data={
                    "case_count": len(active_cases),
                    "case_types": [c.case_type for c in active_cases],
                    "case_numbers": [c.case_no for c in active_cases if c.case_no]
                }
            ))
            return VerificationCheckResult("Legal Cases", "critical", findings)
        
        return VerificationCheckResult("Legal Cases", "passed", findings)
    
    def check_government_status(self, parcel: LandParcel) -> VerificationCheckResult:
        """Check government/khas land status"""
        findings = []
        
        gov_records = self.db.query(GovernmentStatusRecord).filter(
            GovernmentStatusRecord.parcel_id == parcel.id,
            GovernmentStatusRecord.is_active == True
        ).all()
        
        if not gov_records:
            findings.append(VerificationFinding(
                check_type="government_status",
                finding_type="success",
                severity="low",
                title_en="No Government Interest Found",
                description_en="No matching government-interest or khas land record was found in the available dataset.",
                explanation_en="This does not guarantee the absence of government interest, only that none was found in the available data."
            ))
            return VerificationCheckResult("Government Status", "passed", findings)
        
        findings.append(VerificationFinding(
            check_type="government_status",
            finding_type="issue",
            severity="critical",
            title_en="GOVERNMENT INTEREST SIGNAL",
            description_en=f"Found government-interest or khas land status: {', '.join([g.status_type for g in gov_records])}",
            explanation_en="Government interest or khas land designation may restrict or prohibit private transaction.",
            recommendation_en="CRITICAL SIGNAL: Verify with AC Land Office. Government/khas land may not be privately transferable.",
            related_data={
                "status_types": [g.status_type for g in gov_records],
                "authorities": [g.authority for g in gov_records if g.authority]
            }
        ))
        return VerificationCheckResult("Government Status", "critical", findings)
    
    def check_acquisition(self, parcel: LandParcel) -> VerificationCheckResult:
        """Check land acquisition status"""
        findings = []
        
        acq_records = self.db.query(AcquisitionRecord).filter(
            AcquisitionRecord.parcel_id == parcel.id
        ).all()
        
        if not acq_records:
            findings.append(VerificationFinding(
                check_type="acquisition",
                finding_type="success",
                severity="low",
                title_en="No Acquisition Record Found",
                description_en="No acquisition record was found in the available dataset.",
                explanation_en="This does not guarantee the absence of acquisition proceedings."
            ))
            return VerificationCheckResult("Acquisition", "passed", findings)
        
        active_acq = [a for a in acq_records if a.status in ["proposed", "notified", "acquired"]]
        
        if active_acq:
            findings.append(VerificationFinding(
                check_type="acquisition",
                finding_type="issue",
                severity="critical",
                title_en="ACQUISITION SIGNAL FOUND",
                description_en=f"Land acquisition status: {', '.join([a.status for a in active_acq])}",
                explanation_en="Land under acquisition may not be privately transferable or may be subject to government taking.",
                recommendation_en="CRITICAL SIGNAL: Verify with DC Office and Land Acquisition Department. Do not proceed without clearance.",
                related_data={
                    "acquisition_statuses": [a.status for a in active_acq],
                    "authorities": [a.acquiring_authority for a in active_acq]
                }
            ))
            return VerificationCheckResult("Acquisition", "critical", findings)
        
        return VerificationCheckResult("Acquisition", "passed", findings)
    
    def check_transaction_overlap(
        self,
        parcel: LandParcel,
        claimed_sale_area: Decimal
    ) -> VerificationCheckResult:
        """Check for transaction overlap"""
        findings = []
        
        transactions = self.db.query(Transaction).filter(
            Transaction.parcel_id == parcel.id
        ).order_by(Transaction.transaction_date.desc()).all()
        
        if not transactions:
            findings.append(VerificationFinding(
                check_type="transaction",
                finding_type="info",
                severity="low",
                title_en="No Prior Transaction Found",
                description_en="No transaction record was found in the available dataset.",
                explanation_en="This does not confirm the absence of prior transactions."
            ))
            return VerificationCheckResult("Transaction History", "passed", findings)
        
        # Calculate cumulative transaction area
        total_transacted = sum(float(t.area_decimal) for t in transactions)
        total_area = float(parcel.area_decimal)
        new_total = total_transacted + float(claimed_sale_area)
        
        if new_total > total_area:
            findings.append(VerificationFinding(
                check_type="transaction",
                finding_type="issue",
                severity="critical",
                title_en="POTENTIAL TRANSACTION OVERLAP",
                description_en=f"Previous transactions ({total_transacted} decimal) + Current ({claimed_sale_area} decimal) = {new_total} decimal exceeds total area ({total_area} decimal).",
                explanation_en="The cumulative transaction area exceeds the total parcel area, indicating potential double-sale or overlapping claims.",
                recommendation_en="CRITICAL SIGNAL: Potential transaction overlap detected. Verify all prior transactions and current seller's actual available share.",
                related_data={
                    "total_area": total_area,
                    "prior_transactions": total_transacted,
                    "claimed_sale": float(claimed_sale_area),
                    "calculated_total": new_total
                }
            ))
            return VerificationCheckResult("Transaction History", "critical", findings)
        
        findings.append(VerificationFinding(
            check_type="transaction",
            finding_type="success",
            severity="low",
            title_en="No Transaction Overlap Detected",
            description_en=f"Transaction area is within parcel boundaries.",
            explanation_en="Cumulative transaction area does not exceed total parcel area based on available records."
        ))
        return VerificationCheckResult("Transaction History", "passed", findings)

    def check_historical_consistency(self, parcel: LandParcel) -> VerificationCheckResult:
        """
        Compare historical records (CS -> SA -> RS -> BS survey generations and
        ownership transitions) for internal consistency.

        Deterministic and cautious: inconsistencies are reported as
        "potential" issues requiring review. A transition is NEVER declared
        illegal automatically.
        """
        findings = []

        historical_records = self.db.query(HistoricalRecord).filter(
            HistoricalRecord.parcel_id == parcel.id
        ).order_by(HistoricalRecord.record_date.asc()).all()

        if not historical_records:
            findings.append(VerificationFinding(
                check_type="historical",
                finding_type="info",
                severity="medium",
                title_en="No Historical Record Found",
                description_en="No historical ownership/survey records were found in the available dataset for this parcel.",
                explanation_en="Without historical records (e.g., CS/SA/RS/BS survey lineage), the ownership history cannot be verified.",
                recommendation_en="INSUFFICIENT DATA: Obtain certified copies of previous khatians (CS/SA/RS/BS) from the land records office."
            ))
            return VerificationCheckResult("Historical Consistency", "insufficient_data", findings)

        issues = []

        # 1. Chronology: record dates must not be in the future and must be
        #    non-decreasing in the ordered sequence.
        now = datetime.now(timezone.utc)
        future_records = [h for h in historical_records if h.record_date and h.record_date > now]
        if future_records:
            issues.append((
                "Potential Date Inconsistency",
                f"{len(future_records)} historical record(s) carry a future date.",
                "Future-dated records may indicate a data entry issue in the available dataset.",
                "REVIEW REQUIRED: Verify record dates with the land records office.",
                {"future_count": len(future_records)}
            ))

        # 2. Area consistency: compare each historical area against the
        #    current parcel area (tolerance 1% for rounding).
        total_area = float(parcel.area_decimal or 0)
        tolerance = max(total_area * 0.01, 0.05)
        inconsistent = [
            h for h in historical_records
            if h.area_decimal is not None and abs(float(h.area_decimal) - total_area) > tolerance
        ]
        if inconsistent:
            details = ", ".join(
                f"{h.record_type or 'record'}: {float(h.area_decimal)} decimal"
                for h in inconsistent[:5]
            )
            issues.append((
                "Historical Area Inconsistency",
                f"{len(inconsistent)} historical record(s) state a different area than the current parcel area ({total_area} decimal): {details}.",
                "Area differences between historical survey generations and the current record may be legitimate (subdivision, partition, resurvey) or may indicate a record discrepancy.",
                "REVIEW REQUIRED: Compare CS/SA/RS/BS khatians. Do not treat this as confirmed wrongdoing - obtain official survey records.",
                {"inconsistent_count": len(inconsistent), "total_area": total_area, "details": details}
            ))

        # 3. Owner chain: a previous record's new_owner should appear as the
        #    following record's previous_owner when both are stated. Gaps are
        #    reported as informational, never as illegal transitions.
        breaks = 0
        ordered_named = [
            h for h in historical_records if h.previous_owner or h.new_owner
        ]
        for prev, nxt in zip(ordered_named, ordered_named[1:]):
            if prev.new_owner and nxt.previous_owner:
                if prev.new_owner.strip().lower() != nxt.previous_owner.strip().lower():
                    breaks += 1
        if breaks > 0:
            issues.append((
                "Ownership Chain Gap",
                f"{breaks} transition(s) where the previous record's new owner does not match the next record's previous owner.",
                "Gaps in the ownership chain can be legitimate (missing intermediate records) and require documentary verification.",
                "REVIEW REQUIRED: Request chain-of-title documents (deeds and mutations) covering all transitions.",
                {"break_count": breaks}
            ))

        if issues:
            for title, description, explanation, recommendation, extra in issues:
                context = {
                    "historical_record_count": len(historical_records),
                    "parcel_area_decimal": total_area
                }
                context.update(extra)
                findings.append(VerificationFinding(
                    check_type="historical",
                    finding_type="warning",
                    severity="medium",
                    title_en=title,
                    description_en=description,
                    explanation_en=explanation,
                    recommendation_en=recommendation,
                    related_data=context
                ))
            return VerificationCheckResult("Historical Consistency", "warning", findings)

        findings.append(VerificationFinding(
            check_type="historical",
            finding_type="success",
            severity="low",
            title_en="Historical Records Consistent",
            description_en=f"{len(historical_records)} historical record(s) are chronologically ordered and area-consistent with the current parcel record.",
            explanation_en="No internal inconsistency was found between the available historical records and the current parcel record.",
            recommendation_en="Proceed with additional verification checks.",
            related_data={"historical_record_count": len(historical_records)}
        ))
        return VerificationCheckResult("Historical Consistency", "passed", findings)

    def check_area_share(
        self,
        parcel: LandParcel,
        claimed_owner: str,
        claimed_share: Decimal
    ) -> VerificationCheckResult:
        """
        Deterministic area/share check.

        Formula: expected seller area = total parcel area x (recorded seller
        share percentage / 100). If the seller claims more area than recorded
        for their share, flag a potential conflict.

        Example: total area = 50 decimal, seller recorded share = 50% ->
        expected seller share = 50 x 0.50 = 25 decimal.
        If the seller claims 50 decimal -> potential area/share conflict.
        """
        findings = []

        # Missing claim information must not be treated as clean.
        if claimed_share is None or float(claimed_share) <= 0:
            findings.append(VerificationFinding(
                check_type="area_share",
                finding_type="info",
                severity="medium",
                title_en="Seller Share Not Stated",
                description_en="The seller did not state a share/area amount, so the area/share calculation cannot be performed.",
                explanation_en="The claimed share is required to compare against the recorded ownership share.",
                recommendation_en="INSUFFICIENT DATA: Request the seller's claimed share and compare with the recorded khatian share."
            ))
            return VerificationCheckResult("Area/Share", "insufficient_data", findings)

        # Recorded share percentage for the claimed owner (active records only)
        ownership_records = self.db.query(OwnershipRecord).filter(
            OwnershipRecord.parcel_id == parcel.id,
            OwnershipRecord.status == "active"
        ).all()

        matching = [
            o for o in ownership_records
            if claimed_owner and o.owner and (
                claimed_owner.lower() in o.owner.name_en.lower()
                or o.owner.name_en.lower() in claimed_owner.lower()
            )
        ]

        if not matching:
            # Ownership identity mismatch is reported by check_ownership;
            # without a recorded share this check cannot compute and is not "clean".
            findings.append(VerificationFinding(
                check_type="area_share",
                finding_type="info",
                severity="medium",
                title_en="No Recorded Share for Claimed Owner",
                description_en=f"No active ownership share is recorded for '{claimed_owner}' on this parcel, so the expected share cannot be calculated.",
                explanation_en="The area/share comparison requires a recorded share percentage for the claimed owner.",
                recommendation_en="INSUFFICIENT DATA: Verify the claimed owner's recorded share in the khatian.",
                related_data={"claimed_owner": claimed_owner}
            ))
            return VerificationCheckResult("Area/Share", "insufficient_data", findings)

        recorded_share_percent = sum(float(o.share_percentage or 0) for o in matching)
        total_area = float(parcel.area_decimal or 0)

        # Explicit deterministic formula
        expected_area = total_area * (recorded_share_percent / 100.0)
        claimed = float(claimed_share)

        if claimed > expected_area + 0.01:  # 0.01 decimal tolerance for rounding
            findings.append(VerificationFinding(
                check_type="area_share",
                finding_type="issue",
                severity="high",
                title_en="Potential Area/Share Conflict",
                description_en=(
                    f"Claimed area ({claimed} decimal) exceeds the seller's expected share "
                    f"({expected_area} decimal = {total_area} decimal x {recorded_share_percent}%)."
                ),
                explanation_en=(
                    "The seller claims more land than their recorded ownership share supports. "
                    "This may be a misunderstanding of shared ownership or a potential misrepresentation."
                ),
                recommendation_en=(
                    "HIGH ATTENTION: Verify the seller's actual share in the current khatian. "
                    "Do not rely on the seller's stated area alone."
                ),
                related_data={
                    "total_area_decimal": total_area,
                    "recorded_share_percent": recorded_share_percent,
                    "expected_seller_area_decimal": expected_area,
                    "claimed_area_decimal": claimed
                }
            ))
            return VerificationCheckResult("Area/Share", "attention", findings)

        findings.append(VerificationFinding(
            check_type="area_share",
            finding_type="success",
            severity="low",
            title_en="Area/Share Consistent",
            description_en=(
                f"Claimed area ({claimed} decimal) is within the seller's expected share "
                f"({expected_area} decimal = {total_area} decimal x {recorded_share_percent}%)."
            ),
            explanation_en="The deterministic area/share calculation is consistent with the recorded ownership share."
        ))
        return VerificationCheckResult("Area/Share", "passed", findings)

    def check_cross_record_consistency(self, parcel: LandParcel) -> VerificationCheckResult:
        """
        Cross-record consistency: correlate ownership, history, mutation,
        transaction, government, acquisition and case records for mutual
        contradictions. Deterministic and explainable.
        """
        findings = []

        ownership_records = self.db.query(OwnershipRecord).filter(
            OwnershipRecord.parcel_id == parcel.id,
            OwnershipRecord.status == "active"
        ).all()
        mutation_records = self.db.query(MutationRecord).filter(
            MutationRecord.parcel_id == parcel.id
        ).all()
        transaction_records = self.db.query(Transaction).filter(
            Transaction.parcel_id == parcel.id
        ).all()

        issues = []
        total_area = float(parcel.area_decimal or 0)

        # 1. Active ownership shares should total ~100% (tolerance 1%)
        if ownership_records:
            share_total = sum(float(o.share_percentage or 0) for o in ownership_records)
            if abs(share_total - 100.0) > 1.0:
                issues.append((
                    "Ownership Shares Do Not Total 100%",
                    f"Active ownership records total {share_total}% of the parcel (expected ~100%).",
                    "Shares not totalling 100% may indicate missing co-owner records or a data discrepancy.",
                    "REVIEW REQUIRED: Obtain the complete khatian listing all co-sharers.",
                    {"share_total": share_total}
                ))

        # 2. Approved mutation area should match the parcel area (1% tolerance)
        approved_mutations = [m for m in mutation_records if m.status == "approved" and m.area_decimal]
        if approved_mutations:
            mismatched = [
                m for m in approved_mutations
                if abs(float(m.area_decimal) - total_area) > max(total_area * 0.01, 0.05)
            ]
            if mismatched:
                details = ", ".join(f"{m.mutation_no or 'record'}: {float(m.area_decimal)} decimal" for m in mismatched[:3])
                issues.append((
                    "Mutation Area Differs From Parcel Area",
                    f"Approved mutation record(s) state a different area than the parcel ({total_area} decimal): {details}.",
                    "A difference may be legitimate (partial mutation, subdivision) or a record discrepancy.",
                    "REVIEW REQUIRED: Compare the mutation certificate with the current khatian.",
                    {"total_area": total_area, "details": details}
                ))

        # 3. Cumulative transacted area vs parcel area (uses records only;
        #    overlaps with the current claim are covered by the transaction check)
        if transaction_records:
            transacted = sum(float(t.area_decimal or 0) for t in transaction_records)
            if transacted > total_area + 0.01:
                issues.append((
                    "Recorded Transactions Exceed Parcel Area",
                    f"Recorded transactions total {transacted} decimal against a parcel area of {total_area} decimal.",
                    "Cumulative recorded transfers exceeding the parcel area indicate potential double sales or record errors.",
                    "REVIEW REQUIRED: Obtain all prior deeds for this dag and reconcile areas.",
                    {"transacted": transacted, "total_area": total_area}
                ))

        # 4. Government interest or acquisition combined with recent approved
        #    mutation - flag for manual reconciliation (not a contradiction by itself)
        gov_active = self.db.query(GovernmentStatusRecord).filter(
            GovernmentStatusRecord.parcel_id == parcel.id,
            GovernmentStatusRecord.is_active == True
        ).count()
        acq_active = self.db.query(AcquisitionRecord).filter(
            AcquisitionRecord.parcel_id == parcel.id,
            AcquisitionRecord.status.in_(["proposed", "notified", "acquired"])
        ).count()
        if (gov_active or acq_active) and approved_mutations:
            issues.append((
                "Government Interest With Recent Mutation",
                "The parcel has both government-interest/acquisition records and an approved mutation.",
                "These can coexist legitimately (e.g., mutation predates acquisition) but should be reconciled with the land office.",
                "REVIEW REQUIRED: Confirm the sequence of mutation and government/acquisition records with the AC Land Office.",
                {}
            ))

        if issues:
            for title, description, explanation, recommendation, extra in issues:
                context = {
                    "ownership_count": len(ownership_records),
                    "mutation_count": len(mutation_records),
                    "transaction_count": len(transaction_records)
                }
                context.update(extra)
                findings.append(VerificationFinding(
                    check_type="cross_record",
                    finding_type="warning",
                    severity="medium",
                    title_en=title,
                    description_en=description,
                    explanation_en=explanation,
                    recommendation_en=recommendation,
                    related_data=context
                ))
            return VerificationCheckResult("Cross-Record Consistency", "warning", findings)

        findings.append(VerificationFinding(
            check_type="cross_record",
            finding_type="success",
            severity="low",
            title_en="Cross-Record Consistency Passed",
            description_en="No contradictions found between ownership, mutation, transaction, government and acquisition records.",
            explanation_en="All available record types are mutually consistent for this parcel."
        ))
        return VerificationCheckResult("Cross-Record Consistency", "passed", findings)

    def calculate_risk(self, check_results: List[VerificationCheckResult]) -> Tuple[str, int]:
        """Calculate overall risk level - deterministic rules.

        Missing data must not be treated as clean: two or more checks with
        insufficient data produce INSUFFICIENT_DATA regardless of warnings.
        """

        critical_count = sum(1 for check in check_results if check.status == "critical")
        attention_count = sum(1 for check in check_results if check.status == "attention")
        warning_count = sum(1 for check in check_results if check.status == "warning")
        insufficient_count = sum(1 for check in check_results if check.status == "insufficient_data")

        # Deterministic risk calculation
        if critical_count > 0:
            return "CRITICAL_SIGNAL", 90 + (critical_count * 5)
        elif attention_count > 0:
            return "HIGH_ATTENTION", 70 + (attention_count * 5)
        elif insufficient_count >= 2:
            return "INSUFFICIENT_DATA", 0
        elif warning_count > 0:
            return "REVIEW_REQUIRED", 40 + (warning_count * 5)
        elif insufficient_count > 0:
            return "REVIEW_REQUIRED", 30
        else:
            return "LOW_CONCERN", 10

    def run_verification(
        self,
        parcel: LandParcel,
        claimed_owner: str,
        claimed_share: Decimal,
        claimed_sale_area: Decimal
    ) -> Tuple[str, int, List[VerificationCheckResult]]:
        """Run complete verification - deterministic and explainable"""

        check_results = []

        # 1. Land Identity
        check_results.append(self.check_land_identity(parcel))

        # 2. Ownership
        check_results.append(self.check_ownership(parcel, claimed_owner, claimed_share))

        # 3. Mutation
        check_results.append(self.check_mutation(parcel))

        # 4. Legal Cases
        check_results.append(self.check_cases(parcel))

        # 5. Government Status
        check_results.append(self.check_government_status(parcel))

        # 6. Acquisition
        check_results.append(self.check_acquisition(parcel))

        # 7. Transaction Overlap
        check_results.append(self.check_transaction_overlap(parcel, claimed_sale_area))

        # 8. Historical Consistency (CS -> SA -> RS -> BS lineage)
        check_results.append(self.check_historical_consistency(parcel))

        # 9. Area/Share (deterministic formula)
        check_results.append(self.check_area_share(parcel, claimed_owner, claimed_share))

        # 10. Cross-Record Consistency
        check_results.append(self.check_cross_record_consistency(parcel))

        # Calculate overall risk
        risk_level, risk_score = self.calculate_risk(check_results)

        return risk_level, risk_score, check_results
