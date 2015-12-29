from sqlalchemy import Column, Integer, ForeignKey, DateTime

from .generic import Content
from virtuoso.alchemy import CoerceUnicode
from .langstrings import LangString, LangStringEntry, Locale


class Webpage(Content):
    __tablename__ = "webpage"
    id = Column(
        Integer, ForeignKey(
            'content.id',
            ondelete='CASCADE'
        ), primary_key=True)
    url = Column(CoerceUnicode, unique=True)
    last_modified_date = Column(DateTime, nullable=True)
    # Should we cache the page content?

    __mapper_args__ = {
        'polymorphic_identity': 'webpage',
    }

    def get_body(self):
        return LangString.EMPTY

    def get_title(self):
        ls = LangString()
        _ = LangStringEntry(
            ls, value=self.url,
            locale_id=Locale.get_id_of(Locale.NON_LINGUISTIC))
        return ls

    @classmethod
    def get_instance(cls, uri):
        page = cls.get_by(url=uri)
        if page:
            return page
        return Content.get_instance(uri)

    @classmethod
    def get_database_id(cls, identifier):
        page = cls.get_by(url=identifier)
        if page:
            return page.id
